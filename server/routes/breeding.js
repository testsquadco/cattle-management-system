const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Cattle = require('../models/Cattle');
const BreedingReport = require('../models/BreedingReport');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get all breeding cattle
router.get('/cattle', auth, async (req, res) => {
    try {
        const breedingCattle = await Cattle.find({ purpose: 'Breeding' })
            .sort({ tag: 1 });
        res.json(breedingCattle);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching breeding cattle', error: error.message });
    }
});

// Add mating record
router.post('/mating', [
    auth,
    body('cattleId').isMongoId().withMessage('Valid cattle ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('method').isIn(['AI', 'Natural']).withMessage('Valid mating method is required'),
    body('partnerId').optional().isMongoId().withMessage('Valid partner ID is required'),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { cattleId, date, method, partnerId, notes } = req.body;

        // Verify cattle exists and is for breeding
        const cattle = await Cattle.findById(cattleId);
        if (!cattle) {
            return res.status(404).json({ message: 'Cattle not found' });
        }
        if (cattle.purpose !== 'Breeding') {
            return res.status(400).json({ message: 'Selected cattle is not for breeding' });
        }

        // If partner is specified, verify it exists and is appropriate
        if (partnerId) {
            const partner = await Cattle.findById(partnerId);
            if (!partner) {
                return res.status(404).json({ message: 'Partner cattle not found' });
            }
            if (partner.purpose !== 'Breeding') {
                return res.status(400).json({ message: 'Partner cattle is not for breeding' });
            }
            if (partner.gender === cattle.gender) {
                return res.status(400).json({ message: 'Partner cattle must be of opposite gender' });
            }
        }

        // Add mating record
        cattle.matingHistory.push({
            date: new Date(date),
            method,
            partnerId,
            result: {
                pregnancyStatus: 'Pending',
                offspringCount: 0,
                notes
            }
        });

        await cattle.save();
        res.json(cattle);
    } catch (error) {
        res.status(500).json({ message: 'Error adding mating record', error: error.message });
    }
});

// Update mating result
router.put('/mating/:cattleId/:matingId', [
    auth,
    body('pregnancyStatus').isIn(['Pending', 'Confirmed', 'Failed']).withMessage('Valid pregnancy status is required'),
    body('offspringCount').isInt({ min: 0 }).withMessage('Valid offspring count is required'),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { cattleId, matingId } = req.params;
        const { pregnancyStatus, offspringCount, notes } = req.body;

        const cattle = await Cattle.findById(cattleId);
        if (!cattle) {
            return res.status(404).json({ message: 'Cattle not found' });
        }

        // Find and update the specific mating record
        const matingRecord = cattle.matingHistory.id(matingId);
        if (!matingRecord) {
            return res.status(404).json({ message: 'Mating record not found' });
        }

        matingRecord.result = {
            pregnancyStatus,
            offspringCount,
            notes
        };

        // Update total offspring count if pregnancy is confirmed
        if (pregnancyStatus === 'Confirmed') {
            cattle.numberOfOffspring += offspringCount;
        }

        await cattle.save();
        res.json(cattle);
    } catch (error) {
        res.status(500).json({ message: 'Error updating mating result', error: error.message });
    }
});

// Generate breeding report
router.post('/report', [
    auth,
    body('reportType').isIn(['Individual', 'Farm']).withMessage('Valid report type is required'),
    body('cattleId').optional().isMongoId().withMessage('Valid cattle ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { reportType, cattleId, startDate, endDate } = req.body;

        // Base query for the period
        const periodQuery = {
            purpose: 'Breeding',
            breedingStartDate: { $lte: new Date(endDate) }
        };

        if (reportType === 'Individual') {
            if (!cattleId) {
                return res.status(400).json({ message: 'Cattle ID is required for individual reports' });
            }
            periodQuery._id = mongoose.Types.ObjectId(cattleId);
        }

        // Get breeding cattle data
        const breedingCattle = await Cattle.find(periodQuery);
        if (breedingCattle.length === 0) {
            return res.status(404).json({ message: 'No breeding cattle found for the specified criteria' });
        }

        // Calculate metrics
        const metrics = {
            totalBreedingCattle: breedingCattle.length,
            totalOffspring: breedingCattle.reduce((sum, cattle) => sum + cattle.numberOfOffspring, 0),
            totalExpenses: breedingCattle.reduce((sum, cattle) => sum + cattle.totalExpenses, 0),
            feedConsumed: breedingCattle.reduce((sum, cattle) => sum + cattle.dailyFeedKg, 0)
        };

        // Find top performers (cows with most offspring)
        const topPerformers = breedingCattle
            .filter(cattle => cattle.breedingRole === 'Cow')
            .sort((a, b) => b.numberOfOffspring - a.numberOfOffspring)
            .slice(0, 5)
            .map(cattle => ({
                cattle: cattle._id,
                offspringCount: cattle.numberOfOffspring,
                successRate: cattle.matingHistory.filter(m => m.result.pregnancyStatus === 'Confirmed').length / cattle.matingHistory.length
            }));

        // Create the report
        const report = new BreedingReport({
            reportType,
            cattle: reportType === 'Individual' ? cattleId : undefined,
            period: { startDate: new Date(startDate), endDate: new Date(endDate) },
            metrics,
            topPerformers
        });

        await report.save();
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Error generating breeding report', error: error.message });
    }
});

// Get breeding reports
router.get('/reports', auth, async (req, res) => {
    try {
        const { cattleId, startDate, endDate } = req.query;
        const query = {};

        if (cattleId) {
            query.cattle = cattleId;
        }
        if (startDate && endDate) {
            query['period.startDate'] = { $gte: new Date(startDate) };
            query['period.endDate'] = { $lte: new Date(endDate) };
        }

        const reports = await BreedingReport.find(query)
            .populate('cattle', 'tag name')
            .populate('topPerformers.cattle', 'tag name')
            .sort({ date: -1 });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching breeding reports', error: error.message });
    }
});

module.exports = router; 