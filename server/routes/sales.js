const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes below require authentication
router.use(auth);

/**
 * POST /api/sales
 * Record a new sale. Reduces product stock.
 * Body: { productId, quantity (optional, default 1) }
 */
router.post('/', async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check stock availability
        if (product.quantity < quantity) {
            return res.status(400).json({
                message: `Insufficient stock. Only ${product.quantity} left.`,
            });
        }

        // Create sale record
        const sale = await Sale.create({
            product: product._id,
            productName: product.name,
            quantity,
            sellingPrice: product.sellingPrice,
        });

        // Reduce product stock
        product.quantity -= quantity;
        await product.save();

        res.status(201).json({
            message: 'Sale recorded successfully',
            sale,
            remainingStock: product.quantity,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/sales/today
 * Get all sales from today.
 */
router.get('/today', async (req, res) => {
    try {
        // Get start and end of today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sales = await Sale.find({
            date: { $gte: today, $lt: tomorrow },
        }).sort({ date: -1 });

        // Calculate totals
        const totalAmount = sales.reduce((sum, sale) => sum + (sale.sellingPrice * sale.quantity), 0);
        const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

        res.json({
            sales,
            totalAmount,
            totalProfit,
            count: sales.length,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/sales
 * Get all sales. Supports date range filtering.
 * Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        } else if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            query.date = { $gte: start };
        }

        const sales = await Sale.find(query).sort({ date: -1 });

        const totalAmount = sales.reduce((sum, sale) => sum + (sale.sellingPrice * sale.quantity), 0);
        const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

        res.json({
            sales,
            totalAmount,
            totalProfit,
            count: sales.length,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
