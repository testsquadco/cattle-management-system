const mongoose = require('mongoose');

const matingSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    method: {
        type: String,
        enum: ['AI', 'Natural'],
        required: true
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cattle',
        required: false
    },
    result: {
        pregnancyStatus: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Failed'],
            default: 'Pending'
        },
        offspringCount: {
            type: Number,
            default: 0
        },
        notes: String
    }
}, { timestamps: true });

const cattleSchema = new mongoose.Schema({
    tag: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        default: ''
    },
    breed: {
        type: String,
        required: true
    },
    colorMarkings: {
        type: String,
        trim: true,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    purchasePrice: {
        type: Number,
        required: true
    },
    transportationCost: {
        type: Number,
        required: true,
        default: 0
    },
    purchaseDate: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female']
    },
    weight: {
        type: Number,
        required: true
    },
    dailyFeedKg: {
        type: Number,
        default: function() {
            // Calculate based on current weight: 3% of weight
            return this.weight ? this.weight * 0.03 : 0;
        }
    },
    purpose: {
        type: String,
        required: true,
        enum: ['For Sale', 'Breeding'],
        default: 'For Sale'
    },
    // Sale-related fields
    expectedSalePrice: {
        type: Number,
        default: 0,
        required: function() { return this.purpose === 'For Sale'; }
    },
    actualSalePrice: {
        type: Number,
        default: 0
    },
    saleDate: {
        type: Date,
        required: function() {
            return this.actualSalePrice > 0;
        }
    },
    profitLoss: {
        type: Number,
        default: 0
    },
    // Breeding-related fields
    breedingRole: {
        type: String,
        enum: ['Bull', 'Cow'],
        required: function() { return this.purpose === 'Breeding'; }
    },
    breedingStartDate: {
        type: Date,
        required: function() { return this.purpose === 'Breeding'; }
    },
    numberOfOffspring: {
        type: Number,
        default: 0,
        min: 0
    },
    breedingNotes: {
        type: String,
        default: ''
    },
    matingMethod: {
        type: String,
        enum: ['AI', 'Natural'],
        required: function() { return this.purpose === 'Breeding'; }
    },
    matingHistory: [matingSchema],
    notes: {
        type: String,
        default: ''
    },
    totalExpenses: {
        type: Number,
        default: 0
    },
    custodyType: {
        type: String,
        required: true,
        enum: ['Owned', 'Custody', 'Sold'],
        default: 'Owned'
    },
    custodyDetails: {
        ownerName: {
            type: String,
            required: function() { return this.custodyType === 'Custody'; }
        },
        ownerContact: {
            type: String,
            required: function() { return this.custodyType === 'Custody'; }
        },
        monthlyFee: {
            type: Number,
            required: function() { return this.custodyType === 'Custody'; },
            min: 0
        },
        startDate: {
            type: Date,
            required: function() { return this.custodyType === 'Custody'; }
        },
        endDate: {
            type: Date
        },
        notes: {
            type: String
        }
    },
    season: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Season',
        required: true
    },
    carryForwardFromSeason: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Season',
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for expense per offspring
cattleSchema.virtual('expensePerOffspring').get(function() {
    if (this.purpose === 'Breeding' && this.numberOfOffspring > 0) {
        return this.totalExpenses / this.numberOfOffspring;
    }
    return 0;
});

// Calculate total expenses before saving
cattleSchema.pre('save', function(next) {
    // This will be updated when expenses are added/removed
    next();
});

// Calculate profit/loss when actual sale price is set
cattleSchema.pre('save', function(next) {
    if (this.purpose === 'For Sale' && this.actualSalePrice > 0 && this.saleDate) {
        // Calculate total cost: purchase price + transportation + total expenses
        const totalCost = this.purchasePrice + this.transportationCost + this.totalExpenses;
        this.profitLoss = this.actualSalePrice - totalCost;
    }
    next();
});

// Update daily feed when weight changes
cattleSchema.pre('save', function(next) {
    if (this.isModified('weight')) {
        this.dailyFeedKg = this.weight * 0.03;
    }
    next();
});

// Validate breeding role based on gender
cattleSchema.pre('save', function(next) {
    if (this.purpose === 'Breeding') {
        if (this.gender === 'Male' && this.breedingRole !== 'Bull') {
            return next(new Error('Male breeding cattle must have Bull breeding role'));
        }
        if (this.gender === 'Female' && this.breedingRole !== 'Cow') {
            return next(new Error('Female breeding cattle must have Cow breeding role'));
        }
    }
    next();
});

module.exports = mongoose.model('Cattle', cattleSchema); 