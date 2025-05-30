const mongoose = require('mongoose');

const dailyFeedLogSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
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
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalCost: {
        type: Number,
        required: true,
        min: 0
    },
    cattle: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cattle'
    }],
    cattleGroup: {
        type: String,
        trim: true
    },
    notes: {
        type: String
    },
    recordedBy: {
        type: String,
        enum: ['Eliya', 'Kumail'],
        required: true
    }
}, {
    timestamps: true
});

// Calculate total cost before saving
dailyFeedLogSchema.pre('save', function(next) {
    this.totalCost = this.quantity * this.unitPrice;
    next();
});

// Update feed item stock after saving
dailyFeedLogSchema.post('save', async function(doc) {
    const FeedItem = mongoose.model('FeedItem');
    await FeedItem.findByIdAndUpdate(doc.feedItem, {
        $inc: { currentStock: -doc.quantity }
    });
});

// Update feed item stock after removing
dailyFeedLogSchema.post('remove', async function(doc) {
    const FeedItem = mongoose.model('FeedItem');
    await FeedItem.findByIdAndUpdate(doc.feedItem, {
        $inc: { currentStock: doc.quantity }
    });
});

// Indexes for efficient querying
dailyFeedLogSchema.index({ date: -1 });
dailyFeedLogSchema.index({ feedItem: 1, date: -1 });
dailyFeedLogSchema.index({ cattle: 1, date: -1 });
dailyFeedLogSchema.index({ cattleGroup: 1, date: -1 });

module.exports = mongoose.model('DailyFeedLog', dailyFeedLogSchema); 