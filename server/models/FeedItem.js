const mongoose = require('mongoose');

const feedItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategory: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'g', 'l', 'ml', 'piece'],
        default: 'kg'
    },
    currentStock: {
        type: Number,
        default: 0,
        min: 0
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    nutritionalInfo: {
        protein: {
            type: Number,
            min: 0,
            max: 100
        },
        fat: {
            type: Number,
            min: 0,
            max: 100
        },
        fiber: {
            type: Number,
            min: 0,
            max: 100
        },
        energy: {
            type: Number,
            min: 0
        }
    },
    supplier: {
        type: String,
        trim: true
    },
    minimumStock: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Index for efficient querying
feedItemSchema.index({ name: 1 });
feedItemSchema.index({ category: 1 });
feedItemSchema.index({ subCategory: 1 });

module.exports = mongoose.model('FeedItem', feedItemSchema); 