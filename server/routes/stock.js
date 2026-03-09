const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes below require authentication
router.use(auth);

/**
 * GET /api/stock
 * Get all stock items. Supports optional search query (?search=term).
 */
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        // If search query provided, search in name, shadeType, barcode
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { shadeType: { $regex: search, $options: 'i' } },
                    { barcode: { $regex: search, $options: 'i' } },
                ],
            };
        }

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/stock/barcode/:code
 * Find a product by its barcode number.
 */
router.get('/barcode/:code', async (req, res) => {
    try {
        const product = await Product.findOne({ barcode: req.params.code });
        if (!product) {
            return res.status(404).json({ message: 'Product not found with this barcode' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/stock/:id
 * Get a single stock item by ID.
 */
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * POST /api/stock
 * Create a new stock item.
 */
router.post('/', async (req, res) => {
    try {
        const { name, shadeType, size, quantity, sellingPrice, barcode } = req.body;

        // Validate required fields
        if (!name || quantity === undefined || !sellingPrice) {
            return res.status(400).json({ message: 'Name, quantity, and selling price are required' });
        }

        // Check if barcode already exists
        if (barcode) {
            const existingProduct = await Product.findOne({ barcode });
            if (existingProduct) {
                return res.status(400).json({ message: 'A product with this barcode already exists' });
            }
        }

        const product = await Product.create({
            name, shadeType, size, quantity, sellingPrice, barcode,
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * PUT /api/stock/:id
 * Update an existing stock item.
 */
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // If barcode is being changed, check for duplicates
        if (req.body.barcode && req.body.barcode !== product.barcode) {
            const existingProduct = await Product.findOne({ barcode: req.body.barcode });
            if (existingProduct) {
                return res.status(400).json({ message: 'A product with this barcode already exists' });
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * DELETE /api/stock/:id
 * Delete a stock item.
 */
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
