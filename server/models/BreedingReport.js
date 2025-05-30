const mongoose = require('mongoose');

const breedingReportSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    reportType: {
        type: String,
        enum: ['Individual', 'Farm'],
        required: true
    },
    cattle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cattle',
        required: function() { return this.reportType === 'Individual'; }
    },
    period: {
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        }
    },
    metrics: {
        totalBreedingCattle: {
            type: Number,
            required: function() { return this.reportType === 'Farm'; }
        },
        totalOffspring: {
            type: Number,
            required: true,
            default: 0
        },
        totalExpenses: {
            type: Number,
            required: true,
            default: 0
        },
        expensePerOffspring: {
            type: Number,
            default: 0
        },
        feedConsumed: {
            type: Number,
            default: 0
        },
        successRate: {
            type: Number,
            default: 0
        }
    },
    topPerformers: [{
        cattle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cattle'
        },
        offspringCount: Number,
        successRate: Number
    }],
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Calculate metrics before saving
breedingReportSchema.pre('save', function(next) {
    // Calculate expense per offspring if there are any offspring
    if (this.metrics.totalOffspring > 0) {
        this.metrics.expensePerOffspring = this.metrics.totalExpenses / this.metrics.totalOffspring;
    }

    next();
});

module.exports = mongoose.model('BreedingReport', breedingReportSchema); 