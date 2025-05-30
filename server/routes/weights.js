const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Weight = require('../models/Weight');
const { auth } = require('../middleware/auth');

// Get all weights for a cattle
router.get('/cattle/:cattleId', auth, async (req, res) => {
    try {
        const weights = await Weight.find({ cattle: req.params.cattleId })
            .populate('cattle', 'tag breed')
            .sort({ date: -1 });

        // Calculate weight changes and ADG for each entry
        const enrichedWeights = await Promise.all(weights.map(async (weight, index) => {
            const weightData = weight.toObject();
            
            if (index < weights.length - 1) {
                const previousWeight = weights[index + 1];
                const daysDiff = Math.round((weight.date - previousWeight.date) / (1000 * 60 * 60 * 24));
                const weightDiff = weight.weight - previousWeight.weight;
                
                weightData.weightChange = weightDiff;
                weightData.daysSinceLastWeigh = daysDiff;
                weightData.averageDailyGain = daysDiff > 0 ? weightDiff / daysDiff : 0;
            }
            
            return weightData;
        }));

        res.json(enrichedWeights);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching weights', error: error.message });
    }
});

// Add new weight entry
router.post('/', [
    auth,
    body('cattle').isMongoId(),
    body('weight')
        .isNumeric()
        .isFloat({ min: 0 })
        .withMessage('Weight must be a positive number'),
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be valid'),
    body('notes')
        .optional()
        .trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const weight = new Weight(req.body);
        await weight.save();
        await weight.populate('cattle', 'tag breed');

        // Get previous weight for comparison
        const previousWeight = await Weight.findOne({
            cattle: req.body.cattle,
            date: { $lt: weight.date }
        }).sort({ date: -1 });

        const weightData = weight.toObject();
        if (previousWeight) {
            const daysDiff = Math.round((weight.date - previousWeight.date) / (1000 * 60 * 60 * 24));
            const weightDiff = weight.weight - previousWeight.weight;
            
            weightData.weightChange = weightDiff;
            weightData.daysSinceLastWeigh = daysDiff;
            weightData.averageDailyGain = daysDiff > 0 ? weightDiff / daysDiff : 0;
        }

        res.status(201).json(weightData);
    } catch (error) {
        res.status(500).json({ message: 'Error adding weight entry', error: error.message });
    }
});

// Update weight entry
router.put('/:id', [
    auth,
    body('weight')
        .optional()
        .isNumeric()
        .isFloat({ min: 0 }),
    body('date')
        .optional()
        .isISO8601(),
    body('notes')
        .optional()
        .trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const weight = await Weight.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('cattle', 'tag breed');

        if (!weight) {
            return res.status(404).json({ message: 'Weight entry not found' });
        }

        res.json(weight);
    } catch (error) {
        res.status(500).json({ message: 'Error updating weight entry', error: error.message });
    }
});

// Delete weight entry
router.delete('/:id', auth, async (req, res) => {
    try {
        const weight = await Weight.findByIdAndDelete(req.params.id);
        if (!weight) {
            return res.status(404).json({ message: 'Weight entry not found' });
        }
        res.json({ message: 'Weight entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting weight entry', error: error.message });
    }
});

// Export weight data to Excel
router.get('/cattle/:cattleId/export', auth, async (req, res) => {
    try {
        const weights = await Weight.find({ cattle: req.params.cattleId })
            .populate('cattle', 'tag breed')
            .sort({ date: -1 });

        // Convert to CSV format
        const csvRows = ['Date,Weight (kg),Weight Change (kg),Days Since Last Weigh,Average Daily Gain (kg/day),Notes'];
        
        weights.forEach((weight, index) => {
            const row = [];
            row.push(weight.date.toISOString().split('T')[0]);
            row.push(weight.weight);
            
            if (index < weights.length - 1) {
                const previousWeight = weights[index + 1];
                const daysDiff = Math.round((weight.date - previousWeight.date) / (1000 * 60 * 60 * 24));
                const weightDiff = weight.weight - previousWeight.weight;
                const adg = daysDiff > 0 ? weightDiff / daysDiff : 0;
                
                row.push(weightDiff);
                row.push(daysDiff);
                row.push(adg.toFixed(2));
            } else {
                row.push('','','');
            }
            
            row.push(weight.notes || '');
            csvRows.push(row.join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=weight_history_${req.params.cattleId}.csv`);
        res.send(csvRows.join('\n'));
    } catch (error) {
        res.status(500).json({ message: 'Error exporting weights', error: error.message });
    }
});

module.exports = router; 