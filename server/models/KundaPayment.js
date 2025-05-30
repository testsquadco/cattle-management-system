const mongoose = require('mongoose');

const kundaPaymentSchema = new mongoose.Schema({
    rental: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KundaRental',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    month: {
        type: Date,
        required: true
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Overdue'],
        default: 'Pending'
    },
    receivedBy: {
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

// Index for efficient querying
kundaPaymentSchema.index({ rental: 1, month: -1 });
kundaPaymentSchema.index({ paymentStatus: 1, month: -1 });
kundaPaymentSchema.index({ receivedBy: 1 });

module.exports = mongoose.model('KundaPayment', kundaPaymentSchema); 