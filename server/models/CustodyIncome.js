const mongoose = require('mongoose');

const custodyIncomeSchema = new mongoose.Schema({
    cattle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cattle',
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
custodyIncomeSchema.index({ cattle: 1, month: -1 });
custodyIncomeSchema.index({ paymentStatus: 1, month: -1 });
custodyIncomeSchema.index({ receivedBy: 1 });

module.exports = mongoose.model('CustodyIncome', custodyIncomeSchema); 