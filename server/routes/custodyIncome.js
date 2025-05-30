const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const CustodyIncome = require('../models/CustodyIncome');
const Cattle = require('../models/Cattle');
const { auth } = require('../middleware/auth');

// Get all custody income records
router.get('/', auth, async (req, res) => {
    try {
        const incomeRecords = await CustodyIncome.find()
            .populate('cattle', 'tag breed custodyDetails.ownerName')
            .sort({ month: -1 });
        
        if (!incomeRecords) {
            return res.status(404).json({ message: 'No custody income records found' });
        }
        
        res.json(incomeRecords);
    } catch (error) {
        console.error('Error fetching custody income records:', error);
        res.status(500).json({ 
            message: 'Error fetching custody income records',
            error: error.message 
        });
    }
});

// Create custody income records for all custody cattle
router.post('/generate-monthly', auth, async (req, res) => {
    try {
        const { month } = req.body;
        
        if (!month) {
            return res.status(400).json({ message: 'Month is required' });
        }

        const targetMonth = new Date(month);
        targetMonth.setDate(1); // First day of the month
        const nextMonth = new Date(targetMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Get all cattle in custody
        const custodyCattle = await Cattle.find({ 
            custodyType: 'Custody',
            'custodyDetails.startDate': { $lte: targetMonth },
            $or: [
                { 'custodyDetails.endDate': { $gte: nextMonth } },
                { 'custodyDetails.endDate': null }
            ]
        });

        // Create income records for each cattle
        const incomeRecords = await Promise.all(custodyCattle.map(async (cattle) => {
            // Check if record already exists
            const existingRecord = await CustodyIncome.findOne({
                cattle: cattle._id,
                month: {
                    $gte: targetMonth,
                    $lt: nextMonth
                }
            });

            if (!existingRecord) {
                return new CustodyIncome({
                    cattle: cattle._id,
                    amount: cattle.custodyDetails.monthlyFee,
                    month: targetMonth,
                    paymentStatus: 'Pending',
                    paymentDate: new Date(),
                    notes: `Monthly custody fee for ${cattle.tag}`
                }).save();
            }
            return existingRecord;
        }));

        res.status(201).json(incomeRecords);
    } catch (error) {
        res.status(500).json({ message: 'Error generating custody income records', error: error.message });
    }
});

// Create individual custody payment
router.post('/', [
    auth,
    body('cattle').isMongoId().withMessage('Valid cattle ID is required'),
    body('amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('month').isISO8601().withMessage('Valid payment month is required'),
    body('paymentStatus').isIn(['Pending', 'Paid', 'Overdue']).withMessage('Invalid payment status'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { cattle, amount, month, paymentStatus, notes } = req.body;

        // Verify cattle exists and is in custody
        const cattleDoc = await Cattle.findById(cattle);
        if (!cattleDoc) {
            return res.status(404).json({ message: 'Cattle not found' });
        }
        if (cattleDoc.custodyType !== 'Custody') {
            return res.status(400).json({ message: 'Selected cattle is not in custody' });
        }

        // Check for duplicate payment for the same month
        const existingPayment = await CustodyIncome.findOne({
            cattle,
            month: {
                $gte: new Date(new Date(month).setDate(1)),
                $lt: new Date(new Date(month).setMonth(new Date(month).getMonth() + 1))
            }
        });

        if (existingPayment) {
            return res.status(400).json({ 
                message: 'A payment record already exists for this cattle in the specified month' 
            });
        }

        // Create the payment record
        const payment = new CustodyIncome({
            cattle,
            amount,
            month: new Date(month),
            paymentStatus,
            paymentDate: new Date(),
            notes
        });

        await payment.save();

        // Populate cattle details for response
        const populatedPayment = await CustodyIncome.findById(payment._id)
            .populate('cattle', 'tag breed custodyDetails.ownerName');

        res.status(201).json(populatedPayment);
    } catch (error) {
        console.error('Error creating custody payment:', error);
        res.status(500).json({ 
            message: 'Error creating custody payment',
            error: error.message 
        });
    }
});

// Update custody income record
router.put('/:id', [
    auth,
    body('paymentStatus').isIn(['Pending', 'Paid', 'Overdue']),
    body('paymentDate').optional().isISO8601(),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { paymentStatus, paymentDate, notes } = req.body;

        const incomeRecord = await CustodyIncome.findByIdAndUpdate(
            req.params.id,
            {
                paymentStatus,
                paymentDate: paymentDate || new Date(),
                notes
            },
            { new: true, runValidators: true }
        ).populate('cattle', 'tag breed custodyDetails.ownerName');

        if (!incomeRecord) {
            return res.status(404).json({ message: 'Custody income record not found' });
        }

        res.json(incomeRecord);
    } catch (error) {
        res.status(400).json({ message: 'Error updating custody income record', error: error.message });
    }
});

// Delete custody income record
router.delete('/:id', auth, async (req, res) => {
    try {
        const incomeRecord = await CustodyIncome.findByIdAndDelete(req.params.id);
        if (!incomeRecord) {
            return res.status(404).json({ message: 'Custody income record not found' });
        }
        res.json({ message: 'Custody income record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting custody income record', error: error.message });
    }
});

// Get current month's custody income status
router.get('/current-month-status', auth, async (req, res) => {
    try {
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        // Get all custody income records for current month
        const currentMonthRecords = await CustodyIncome.find({
            month: {
                $gte: firstDayOfMonth,
                $lt: firstDayOfNextMonth
            }
        });

        // Calculate totals
        const totalAmount = currentMonthRecords.reduce((sum, record) => sum + record.amount, 0);
        const totalCattle = currentMonthRecords.length;

        // Calculate payment status totals
        const paid = currentMonthRecords.filter(record => record.paymentStatus === 'Paid')
            .reduce((sum, record) => sum + record.amount, 0);
        const pending = currentMonthRecords.filter(record => record.paymentStatus === 'Pending')
            .reduce((sum, record) => sum + record.amount, 0);
        const overdue = currentMonthRecords.filter(record => record.paymentStatus === 'Overdue')
            .reduce((sum, record) => sum + record.amount, 0);

        res.json({
            totalCattle,
            totalAmount,
            paid,
            pending,
            overdue,
            month: firstDayOfMonth
        });
    } catch (error) {
        console.error('Error fetching current month custody income status:', error);
        res.status(500).json({ 
            message: 'Error fetching current month custody income status',
            error: error.message 
        });
    }
});

module.exports = router; 