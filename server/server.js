const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Import route files
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stock');
const salesRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');
const importRoutes = require('./routes/import');

// Initialize Express app
const app = express();

// --- Middleware ---
app.use(cors());                    // Enable CORS for frontend
app.use(express.json());            // Parse JSON request bodies

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stock/import', importRoutes);

// --- Health Check ---
app.get('/', (req, res) => {
    res.json({ message: 'Inventory Management API is running 🚀' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Handle port-in-use error gracefully
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use. Please free the port and try again.`);
        } else {
            console.error(`❌ Server error: ${err.message}`);
        }
        process.exit(1);
    });
}).catch((err) => {
    console.error(`❌ Failed to start: ${err.message}`);
    process.exit(1);
});

// Handle uncaught exceptions to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});
