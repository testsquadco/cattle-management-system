const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const CustodyIncome = require('../models/CustodyIncome');

// Get all custody payments
router.get('/', auth, async (req, res) => {
    try {
        const payments = await CustodyIncome.find()
            .populate('cattle')
            .sort({ month: -1, createdAt: -1 });
        res.json(payments);
    } catch (error) {
        console.error('Error fetching custody payments:', error);
        res.status(500).json({ 
            message: 'Error fetching custody payments',
            error: error.message 
        });
    }
});

// Create new custody payment
router.post('/', [
    auth,
    body('cattle').notEmpty().withMessage('Cattle ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
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

        const payment = new CustodyIncome(req.body);
        await payment.save();
        
        await payment.populate('cattle');
        res.status(201).json(payment);
    } catch (error) {
        console.error('Error creating custody payment:', error);
        res.status(500).json({ 
            message: 'Error creating custody payment',
            error: error.message 
        });
    }
});

// Update custody payment
router.put('/:id', [
    auth,
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
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

        const payment = await CustodyIncome.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('cattle');

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        console.error('Error updating custody payment:', error);
        res.status(500).json({ 
            message: 'Error updating custody payment',
            error: error.message 
        });
    }
});

// Delete custody payment
router.delete('/:id', auth, async (req, res) => {
    try {
        const payment = await CustodyIncome.findByIdAndDelete(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Error deleting custody payment:', error);
        res.status(500).json({ 
            message: 'Error deleting custody payment',
            error: error.message 
        });
    }
});

module.exports = router; 