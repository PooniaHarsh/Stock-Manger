const mongoose = require('mongoose');

/**
 * Sale Schema — records each sale transaction.
 * Stores product reference and selling price.
 */
const saleSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
    sellingPrice: {
        type: Number,
        required: true,
    },
    purchasePrice: {
        type: Number,
        default: 0,
    },
    profit: {
        type: Number,
        default: 0,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
