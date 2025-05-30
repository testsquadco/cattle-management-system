const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const KundaPayment = require('../models/KundaPayment');
const { auth } = require('../middleware/auth');

// Get all kunda payments
router.get('/', auth, async (req, res) => {
    try {
        const payments = await KundaPayment.find()
            .populate('rental', 'renterName numberOfKundas')
            .sort({ month: -1, createdAt: -1 });
        res.json(payments);
    } catch (error) {
        console.error('Error fetching kunda payments:', error);
        res.status(500).json({ 
            message: 'Error fetching kunda payments',
            error: error.message 
        });
    }
});

// Get current month status
router.get('/current-month-status', auth, async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const payments = await KundaPayment.find({
            month: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        }).populate('rental', 'numberOfKundas pricePerKunda');

        const status = {
            totalKundasRented: payments.reduce((sum, payment) => sum + (payment.rental?.numberOfKundas || 0), 0),
            totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
            paid: payments.filter(payment => payment.paymentStatus === 'Paid')
                .reduce((sum, payment) => sum + payment.amount, 0),
            pending: payments.filter(payment => payment.paymentStatus === 'Pending')
                .reduce((sum, payment) => sum + payment.amount, 0),
            overdue: payments.filter(payment => payment.paymentStatus === 'Overdue')
                .reduce((sum, payment) => sum + payment.amount, 0)
        };

        res.json(status);
    } catch (error) {
        console.error('Error fetching current month status:', error);
        res.status(500).json({ 
            message: 'Error fetching current month status',
            error: error.message 
        });
    }
});

// Create new kunda payment
router.post('/', [
    auth,
    body('rental').notEmpty().withMessage('Rental ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('month').isISO8601().withMessage('Valid month date is required'),
    body('paymentStatus').isIn(['Pending', 'Paid', 'Overdue']).withMessage('Invalid payment status'),
    body('receivedBy').isIn(['Eliya', 'Kumail']).withMessage('Received By must be either Eliya or Kumail'),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const payment = new KundaPayment(req.body);
        await payment.save();
        
        const populatedPayment = await KundaPayment.findById(payment._id)
            .populate('rental', 'renterName numberOfKundas');
            
        res.status(201).json(populatedPayment);
    } catch (error) {
        console.error('Error creating kunda payment:', error);
        res.status(500).json({ 
            message: 'Error creating kunda payment',
            error: error.message 
        });
    }
});

// Update kunda payment
router.put('/:id', [
    auth,
    body('rental').optional().notEmpty().withMessage('Rental ID is required'),
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('month').optional().isISO8601().withMessage('Valid month date is required'),
    body('paymentStatus').optional().isIn(['Pending', 'Paid', 'Overdue']).withMessage('Invalid payment status'),
    body('receivedBy').optional().isIn(['Eliya', 'Kumail']).withMessage('Received By must be either Eliya or Kumail'),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const payment = await KundaPayment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('rental', 'renterName numberOfKundas');

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        console.error('Error updating kunda payment:', error);
        res.status(500).json({ 
            message: 'Error updating kunda payment',
            error: error.message 
        });
    }
});

// Delete kunda payment
router.delete('/:id', auth, async (req, res) => {
    try {
        const payment = await KundaPayment.findByIdAndDelete(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Error deleting kunda payment:', error);
        res.status(500).json({ 
            message: 'Error deleting kunda payment',
            error: error.message 
        });
    }
});

module.exports = router; 