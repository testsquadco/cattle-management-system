const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const KundaRental = require('../models/KundaRental');
const KundaPayment = require('../models/KundaPayment');
const { auth } = require('../middleware/auth');

// Get all Kunda rentals
router.get('/', auth, async (req, res) => {
    try {
        const rentals = await KundaRental.find()
            .sort({ createdAt: -1 });
        res.json(rentals);
    } catch (error) {
        console.error('Error fetching Kunda rentals:', error);
        res.status(500).json({ 
            message: 'Error fetching Kunda rentals',
            error: error.message 
        });
    }
});

// Get active Kunda rentals
router.get('/active', auth, async (req, res) => {
    try {
        const rentals = await KundaRental.find({ isActive: true })
            .sort({ createdAt: -1 });
        res.json(rentals);
    } catch (error) {
        console.error('Error fetching active Kunda rentals:', error);
        res.status(500).json({ 
            message: 'Error fetching active Kunda rentals',
            error: error.message 
        });
    }
});

// Create new Kunda rental
router.post('/', [
    auth,
    body('renterName').trim().notEmpty().withMessage('Renter name is required'),
    body('renterContact').trim().notEmpty().withMessage('Renter contact is required'),
    body('numberOfKundas').isInt({ min: 1 }).withMessage('Number of Kundas must be at least 1'),
    body('pricePerKunda').isFloat({ min: 0 }).withMessage('Price per Kunda must be a positive number'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').optional({ nullable: true }).isISO8601().withMessage('End date must be a valid date'),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const rental = new KundaRental(req.body);
        await rental.save();
        res.status(201).json(rental);
    } catch (error) {
        console.error('Error creating Kunda rental:', error);
        res.status(500).json({ 
            message: 'Error creating Kunda rental',
            error: error.message 
        });
    }
});

// Update Kunda rental
router.put('/:id', [
    auth,
    body('renterName').optional().trim().notEmpty().withMessage('Renter name cannot be empty'),
    body('renterContact').optional().trim().notEmpty().withMessage('Renter contact cannot be empty'),
    body('numberOfKundas').optional().isInt({ min: 1 }).withMessage('Number of Kundas must be at least 1'),
    body('pricePerKunda').optional().isFloat({ min: 0 }).withMessage('Price per Kunda must be a positive number'),
    body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').optional({ nullable: true }).isISO8601().withMessage('End date must be a valid date'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const rental = await KundaRental.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!rental) {
            return res.status(404).json({ message: 'Kunda rental not found' });
        }

        res.json(rental);
    } catch (error) {
        console.error('Error updating Kunda rental:', error);
        res.status(500).json({ 
            message: 'Error updating Kunda rental',
            error: error.message 
        });
    }
});

// Delete Kunda rental
router.delete('/:id', auth, async (req, res) => {
    try {
        const rental = await KundaRental.findByIdAndDelete(req.params.id);
        if (!rental) {
            return res.status(404).json({ message: 'Kunda rental not found' });
        }
        res.json({ message: 'Kunda rental deleted successfully' });
    } catch (error) {
        console.error('Error deleting Kunda rental:', error);
        res.status(500).json({ 
            message: 'Error deleting Kunda rental',
            error: error.message 
        });
    }
});

// Get rental summary
router.get('/summary', auth, async (req, res) => {
    try {
        const activeRentals = await KundaRental.find({ isActive: true });
        
        const summary = {
            totalActiveRentals: activeRentals.length,
            totalKundasRented: activeRentals.reduce((sum, rental) => sum + rental.numberOfKundas, 0),
            totalMonthlyIncome: activeRentals.reduce((sum, rental) => sum + (rental.numberOfKundas * rental.pricePerKunda), 0),
            averagePricePerKunda: activeRentals.length > 0 
                ? activeRentals.reduce((sum, rental) => sum + rental.pricePerKunda, 0) / activeRentals.length 
                : 0
        };

        res.json(summary);
    } catch (error) {
        console.error('Error fetching rental summary:', error);
        res.status(500).json({ 
            message: 'Error fetching rental summary',
            error: error.message 
        });
    }
});

// Get current month payment status
router.get('/current-month-status', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Use provided dates or default to current month
        const selectedMonthStart = startDate ? new Date(startDate) : new Date();
        selectedMonthStart.setDate(1); // First day of month
        const selectedMonthEnd = endDate ? new Date(endDate) : new Date(selectedMonthStart);
        selectedMonthEnd.setMonth(selectedMonthEnd.getMonth() + 1, 0); // Last day of month

        const activeRentals = await KundaRental.find({
            isActive: true,
            startDate: { $lte: selectedMonthEnd },
            $or: [
                { endDate: null },
                { endDate: { $gte: selectedMonthStart } }
            ]
        });

        // Get payments for the selected month
        const payments = await KundaPayment.find({
            month: {
                $gte: selectedMonthStart,
                $lte: selectedMonthEnd
            }
        });

        const totalAmount = activeRentals.reduce((sum, rental) => sum + (rental.numberOfKundas * rental.pricePerKunda), 0);
        const totalKundas = activeRentals.reduce((sum, rental) => sum + rental.numberOfKundas, 0);

        const status = {
            totalKundasRented: totalKundas,
            totalAmount,
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

module.exports = router; 