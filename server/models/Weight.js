const mongoose = require('mongoose');

const weightSchema = new mongoose.Schema({
    cattle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cattle',
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    notes: {
        type: String
    },
    weightChange: {
        type: Number
    },
    adg: {
        type: Number
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add virtual fields for weight analysis
weightSchema.virtual('previousWeight', {
    ref: 'Weight',
    localField: 'cattle',
    foreignField: 'cattle',
    justOne: true,
    options: { sort: { date: -1 } }
});

// Index for efficient querying
weightSchema.index({ cattle: 1, date: -1 });

// Calculate weight change and ADG before saving
weightSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('weight') || this.isModified('date')) {
        // Find the previous weight entry for this cattle
        const previousWeight = await this.constructor.findOne({
            cattle: this.cattle,
            date: { $lt: this.date }
        }).sort({ date: -1 });

        if (previousWeight) {
            // Calculate weight change
            this.weightChange = this.weight - previousWeight.weight;
            
            // Calculate ADG (Average Daily Gain)
            const daysDiff = Math.round((this.date - previousWeight.date) / (1000 * 60 * 60 * 24));
            this.adg = daysDiff > 0 ? this.weightChange / daysDiff : 0;
        } else {
            this.weightChange = 0;
            this.adg = 0;
        }
    }
    next();
});

module.exports = mongoose.model('Weight', weightSchema); 