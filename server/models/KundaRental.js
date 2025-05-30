const mongoose = require('mongoose');

const kundaRentalSchema = new mongoose.Schema({
    renterName: {
        type: String,
        required: true,
        trim: true
    },
    renterContact: {
        type: String,
        required: true,
        trim: true
    },
    numberOfKundas: {
        type: Number,
        required: true,
        min: 1
    },
    pricePerKunda: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total monthly rent
kundaRentalSchema.virtual('totalMonthlyRent').get(function() {
    return this.numberOfKundas * this.pricePerKunda;
});

// Index for efficient querying
kundaRentalSchema.index({ renterName: 1 });
kundaRentalSchema.index({ isActive: 1 });

module.exports = mongoose.model('KundaRental', kundaRentalSchema); 