const mongoose = require('mongoose');

const feedTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    items: [{
        feedItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FeedItem',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        unit: {
            type: String,
            required: true,
            enum: ['kg', 'g', 'l', 'ml', 'piece'],
            default: 'kg'
        }
    }],
    expectedDailyCost: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String,
        enum: ['Eliya', 'Kumail'],
        required: true
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Calculate expected daily cost before saving
feedTemplateSchema.pre('save', async function(next) {
    if (this.isModified('items')) {
        let totalCost = 0;
        for (const item of this.items) {
            const feedItem = await mongoose.model('FeedItem').findById(item.feedItem);
            if (feedItem) {
                totalCost += item.quantity * feedItem.unitPrice;
            }
        }
        this.expectedDailyCost = totalCost;
    }
    next();
});

// Index for efficient querying
feedTemplateSchema.index({ name: 1 });
feedTemplateSchema.index({ isActive: 1 });

module.exports = mongoose.model('FeedTemplate', feedTemplateSchema); 