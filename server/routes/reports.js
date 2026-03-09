const express = require('express');
const Sale = require('../models/Sale');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes below require authentication
router.use(auth);

/**
 * GET /api/reports/daily
 * Get daily sales report. Query: ?date=YYYY-MM-DD (defaults to today).
 */
router.get('/daily', async (req, res) => {
    try {
        const dateStr = req.query.date || new Date().toISOString().split('T')[0];
        const start = new Date(dateStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateStr);
        end.setHours(23, 59, 59, 999);

        const sales = await Sale.find({
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 });

        // Aggregate by product
        const productSummary = {};
        sales.forEach((sale) => {
            const key = sale.productName;
            if (!productSummary[key]) {
                productSummary[key] = {
                    productName: sale.productName,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    totalProfit: 0,
                };
            }
            productSummary[key].totalQuantity += sale.quantity;
            productSummary[key].totalRevenue += sale.sellingPrice * sale.quantity;
            productSummary[key].totalProfit += sale.profit;
        });

        const totalRevenue = sales.reduce((sum, s) => sum + (s.sellingPrice * s.quantity), 0);
        const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);

        res.json({
            date: dateStr,
            totalSales: sales.length,
            totalRevenue,
            totalProfit,
            products: Object.values(productSummary),
            sales,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/reports/monthly
 * Get monthly sales report. Query: ?month=MM&year=YYYY.
 */
router.get('/monthly', async (req, res) => {
    try {
        const now = new Date();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);
        const year = parseInt(req.query.year) || now.getFullYear();

        // Get start and end of the month
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        const sales = await Sale.find({
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 });

        // Aggregate by day
        const dailySummary = {};
        sales.forEach((sale) => {
            const day = sale.date.toISOString().split('T')[0];
            if (!dailySummary[day]) {
                dailySummary[day] = {
                    date: day,
                    totalSales: 0,
                    totalRevenue: 0,
                    totalProfit: 0,
                };
            }
            dailySummary[day].totalSales += 1;
            dailySummary[day].totalRevenue += sale.sellingPrice * sale.quantity;
            dailySummary[day].totalProfit += sale.profit;
        });

        const totalRevenue = sales.reduce((sum, s) => sum + (s.sellingPrice * s.quantity), 0);
        const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);

        res.json({
            month,
            year,
            totalSales: sales.length,
            totalRevenue,
            totalProfit,
            dailyBreakdown: Object.values(dailySummary).sort((a, b) => a.date.localeCompare(b.date)),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
