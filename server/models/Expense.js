const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    cattle: {
        type: [mongoose.Schema.Types.ObjectId],  // Array to support multiple cattle
        ref: 'Cattle',
        required: false,  // Changed to false to make it optional
        default: []  // Default to empty array when no cattle specified
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategory: {
        type: String,
        required: false
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        min: 0
    },
    unit: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String,
        required: true
    },
    receipt: {
        type: String,  // URL to stored receipt image/document
        default: ''
    },
    isSharedExpense: {
        type: Boolean,
        default: false
    },
    totalCattleCount: {
        type: Number,
        default: 1
    },
    contributor: {
        type: String,
        enum: ['Eliya', 'Kumail'],
        required: true
    },
    notes: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add virtual field for per-cattle amount
expenseSchema.virtual('perCattleAmount').get(function() {
    if (this.isSharedExpense) {
        return this.amount / this.totalCattleCount;
    }
    return this.amount;
});

// Index for efficient querying
expenseSchema.index({ cattle: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });

// Update cattle's total expenses when an expense is added
expenseSchema.post('save', async function(doc) {
    const Cattle = mongoose.model('Cattle');
    const amount = doc.perCattleAmount;

    // Update each cattle's total expenses
    const updatePromises = doc.cattle.map(cattleId =>
        Cattle.findByIdAndUpdate(cattleId, {
            $inc: { totalExpenses: amount }
        })
    );
    
    await Promise.all(updatePromises);
});

// Update cattle's total expenses when an expense is removed
expenseSchema.post('remove', async function(doc) {
    const Cattle = mongoose.model('Cattle');
    const amount = doc.perCattleAmount;

    // Update each cattle's total expenses
    const updatePromises = doc.cattle.map(cattleId =>
        Cattle.findByIdAndUpdate(cattleId, {
            $inc: { totalExpenses: -amount }
        })
    );
    
    await Promise.all(updatePromises);
});

module.exports = mongoose.model('Expense', expenseSchema); 