const mongoose = require('mongoose');

/**
 * Product Schema — represents an inventory item.
 * Barcode is unique and indexed for quick lookups.
 */
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
    },
    shadeType: {
        type: String,
        trim: true,
        default: '',
    },
    size: {
        type: String,
        trim: true,
        default: '',
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: 0,
        default: 0,
    },
    purchasePrice: {
        type: Number,
        min: 0,
        default: 0,
    },
    sellingPrice: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: 0,
    },
    barcode: {
        type: String,
        unique: true,
        sparse: true, // allows multiple null values
        trim: true,
        index: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
