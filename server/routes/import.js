const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Multer config — store in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword', // .doc
            'text/csv',
        ];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv|pdf|docx|doc)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Use Excel (.xlsx/.xls/.csv), PDF, or Word (.docx) files.'));
        }
    },
});

/**
 * Parse Excel/CSV file and extract stock items.
 * Expected columns: Name, ShadeType, Size, Quantity, SellingPrice, Barcode
 */
function parseExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    return rows.map((row) => {
        const get = (keys) => {
            for (const key of Object.keys(row)) {
                const lower = key.toLowerCase().replace(/[\s_-]/g, '');
                for (const k of keys) {
                    if (lower.includes(k)) return row[key];
                }
            }
            return '';
        };

        return {
            name: String(get(['name', 'product', 'productname', 'item', 'series']) || '').trim(),
            shadeType: String(get(['shade', 'shadetype', 'type', 'color', 'colour', 'design', 'finish']) || '').trim(),
            size: String(get(['size', 'number', 'sizenumber', 'volume', 'thickness']) || '').trim(),
            quantity: Number(get(['quantity', 'qty', 'stock', 'count'])) || 0,
            sellingPrice: Number(get(['sellingprice', 'sellprice', 'price', 'selling', 'sp', 'mrp'])) || 0,
            barcode: String(get(['barcode', 'barcodenumber', 'code', 'sku', 'upc']) || '').trim(),
        };
    });
}

/**
 * Parse Delivery Challan PDF.
 *
 * Actual extracted text format (from pdf-parse):
 *   "ILAM PREMIUM GRADE 1.0 MM3189 MM 1.00 MM A\n1\n 13"
 *   - Series name is GLUED to design code (no space between "MM" and "3189")
 *   - SR number and quantity are on separate lines
 *   - Some series names wrap: "ILAM PREMIUM GRADE 1.0 \nMM(ESPRESSO)\n14220 CL 1.00 MM A"
 *   - Grade can be "A" or multi-word like "COMMERCIAL"
 *
 * Maps to stock:
 *   name      = SERIES (e.g. "ILAM PREMIUM GRADE 1.0 MM")
 *   shadeType = design code + finish (e.g. "3189 MM", "14220 CL")
 *   size      = from DESIGN NAME (e.g. "1.00 MM")
 *   quantity  = QUANTITY
 */
function parseChallanText(text) {
    const stocks = [];

    // Normalize: join all lines into one string, collapse whitespace
    let normalized = text
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Remove table headers that appear at page boundaries (glued to first data row)
    normalized = normalized.replace(/SR\.DESIGN\s*NAMEGRADEQUANTITYSERIES/gi, ' ');
    // Remove page markers
    normalized = normalized.replace(/Page\s+\d+\s+of\s+\d+/gi, ' ');
    // Remove SERIES TOTAL lines
    normalized = normalized.replace(/\d+\s*SERIES\s*TOTAL:/gi, ' ');
    // Remove final TOTAL line
    normalized = normalized.replace(/TOTAL\s+\d+/gi, ' ');
    // Collapse whitespace again after removals
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // The key pattern in the normalized text:
    // <SERIES_NAME><DESIGN_CODE> <FINISH> <SIZE> MM <GRADE> <SR#> <QTY>
    //
    // Example normalized: "ILAM PREMIUM GRADE 1.0 MM3189 MM 1.00 MM A 1 13"
    // Series ends right where 3-5 digit design code starts (glued, no space)
    // The design code pattern: \d{3,5}\s+[A-Z]{2,4}\s+\d+\.\d+\s+MM
    //
    // We match: <anything>(\d{3,5}) (FINISH) (SIZE) MM (GRADE) (SR#) (QTY)
    // Then extract series name from the text before the design code

    const regex = /([A-Z][A-Z\s\d.()]+?)(\d{3,5})\s+([A-Z]{2,4})\s+(\d+\.\d+)\s+MM\s+([A-Z]+(?:\s+[A-Z]+)?)\s+(\d{1,3})\s+(\d+)/g;

    let match;
    while ((match = regex.exec(normalized)) !== null) {
        let seriesName = match[1].trim().replace(/\s+/g, ' ');
        const designCode = match[2];
        const finishType = match[3];
        const size = `${match[4]} MM`;
        const grade = match[5];
        const sr = parseInt(match[6]);
        const quantity = parseInt(match[7]);

        // Skip totals, headers, page markers
        if (/TOTAL|SR\.|CHALLAN|GSTIN|PAGE/i.test(seriesName)) continue;
        if (sr < 1 || sr > 999) continue;
        if (seriesName.length < 3) continue;

        stocks.push({
            name: seriesName,
            shadeType: `${designCode} ${finishType}`,
            size,
            quantity,
            sellingPrice: 0,
            barcode: '',
        });
    }

    return stocks;
}

/**
 * Generic PDF text parser (fallback).
 */
function parseGenericPDFText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const products = [];

    for (const line of lines) {
        const parts = line.split(/[\t|]|,\s*|\s{2,}/).map(p => p.trim()).filter(p => p);

        if (parts.length >= 3) {
            const nums = [];
            const texts = [];
            for (const part of parts) {
                const num = Number(part.replace(/[₹$,]/g, ''));
                if (!isNaN(num) && part.match(/\d/)) {
                    nums.push(num);
                } else {
                    texts.push(part);
                }
            }

            if (nums.length >= 2 && texts.length >= 1) {
                if (texts[0].toLowerCase().includes('name') || texts[0].toLowerCase().includes('product')) continue;

                products.push({
                    name: texts[0] || '',
                    shadeType: texts[1] || '',
                    size: texts[2] || '',
                    quantity: Math.round(nums[0]) || 0,
                    sellingPrice: nums[1] || 0,
                    barcode: nums.length >= 3 ? String(nums[2]) : '',
                });
            }
        }
    }

    return products;
}

/**
 * Parse Word doc text — same logic as generic PDF.
 */
function parseDocText(text) {
    return parseGenericPDFText(text);
}



/**
 * POST /api/stock/import — Upload and import stock items from file.
 */
router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { buffer, mimetype, originalname } = req.file;
        let parsedItems = [];

        // Determine file type and parse
        if (originalname.match(/\.(xlsx|xls|csv)$/i) || mimetype.includes('spreadsheet') || mimetype.includes('excel') || mimetype === 'text/csv') {
            parsedItems = parseExcel(buffer);
        } else if (originalname.match(/\.pdf$/i) || mimetype === 'application/pdf') {
            const pdfData = await pdfParse(buffer);
            const pdfText = pdfData.text;

            // Try delivery challan parser first (looks for the design name pattern)
            parsedItems = parseChallanText(pdfText);

            // If challan parser found nothing, try generic parser
            if (parsedItems.length === 0) {
                parsedItems = parseGenericPDFText(pdfText);
            }
        } else if (originalname.match(/\.(docx|doc)$/i) || mimetype.includes('word')) {
            const result = await mammoth.extractRawText({ buffer });
            parsedItems = parseDocText(result.value);
        } else {
            return res.status(400).json({ message: 'Unsupported file format' });
        }

        // Filter valid items: must have name AND (quantity > 0 OR sellingPrice > 0)
        const validItems = parsedItems.filter(p =>
            p.name && p.name.length > 0 && (p.quantity > 0 || p.sellingPrice > 0)
        );

        if (validItems.length === 0) {
            return res.status(400).json({
                message: 'No valid stock items found in the file. Make sure your PDF is a Delivery Challan or use an Excel file with columns: Name, Quantity, Selling Price.',
                totalRows: parsedItems.length,
            });
        }

        // Return preview (don't save yet) if preview mode
        if (req.query.preview === 'true') {
            return res.json({
                message: `Found ${validItems.length} stock items`,
                totalRows: parsedItems.length,
                validCount: validItems.length,
                products: validItems,
            });
        }

        // Save stock items to database
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        const errors = [];

        for (const item of validItems) {
            try {
                // Check for existing item by barcode first
                if (item.barcode) {
                    const existing = await Product.findOne({ barcode: item.barcode });
                    if (existing) {
                        existing.quantity += item.quantity;
                        existing.sellingPrice = item.sellingPrice || existing.sellingPrice;
                        await existing.save();
                        updated++;
                        continue;
                    }
                }

                // For items without barcode, check by name + shadeType + size
                if (!item.barcode && item.name && item.shadeType) {
                    const existing = await Product.findOne({
                        name: item.name,
                        shadeType: item.shadeType,
                        size: item.size || '',
                    });
                    if (existing) {
                        existing.quantity += item.quantity;
                        await existing.save();
                        updated++;
                        continue;
                    }
                }

                // Remove empty barcode to avoid unique index conflict
                const cleanItem = { ...item };
                if (!cleanItem.barcode) delete cleanItem.barcode;

                await Product.create(cleanItem);
                imported++;
            } catch (err) {
                if (err.code === 11000) {
                    skipped++;
                    errors.push(`Duplicate: ${item.shadeType} (${item.name})`);
                } else {
                    skipped++;
                    errors.push(`${item.name}: ${err.message}`);
                }
            }
        }

        const msg = [];
        if (imported > 0) msg.push(`${imported} new`);
        if (updated > 0) msg.push(`${updated} updated`);
        if (skipped > 0) msg.push(`${skipped} skipped`);

        res.json({
            message: `Import complete: ${msg.join(', ')}`,
            imported,
            updated,
            skipped,
            totalFound: validItems.length,
            errors: errors.slice(0, 5),
        });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ message: error.message || 'Failed to process file' });
    }
});

module.exports = router;
