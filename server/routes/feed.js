const express = require('express');
const router = express.Router();
const FeedItem = require('../models/FeedItem');
const DailyFeedLog = require('../models/DailyFeedLog');
const FeedTemplate = require('../models/FeedTemplate');
const Category = require('../models/Category');
const { Parser } = require('json2csv');

// Feed Items Routes
router.get('/items', async (req, res) => {
    try {
        const items = await FeedItem.find().populate('category');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/items', async (req, res) => {
    try {
        const item = new FeedItem(req.body);
        const savedItem = await item.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/items/:id', async (req, res) => {
    try {
        const item = await FeedItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/items/:id', async (req, res) => {
    try {
        await FeedItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Feed item deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Daily Feed Logs Routes
router.get('/logs', async (req, res) => {
    try {
        const { startDate, endDate, feedItem, cattle, cattleGroup } = req.query;
        const query = {};
        
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (feedItem) query.feedItem = feedItem;
        if (cattle) query.cattle = cattle;
        if (cattleGroup) query.cattleGroup = cattleGroup;

        const logs = await DailyFeedLog.find(query)
            .populate('feedItem')
            .populate('cattle')
            .sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/logs', async (req, res) => {
    try {
        const log = new DailyFeedLog(req.body);
        const savedLog = await log.save();
        res.status(201).json(savedLog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Monthly Summary Routes
router.get('/monthly-summary', async (req, res) => {
    try {
        const { year, month } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const summary = await DailyFeedLog.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $lookup: {
                    from: 'feeditems',
                    localField: 'feedItem',
                    foreignField: '_id',
                    as: 'feedItemDetails'
                }
            },
            {
                $unwind: '$feedItemDetails'
            },
            {
                $group: {
                    _id: {
                        feedItem: '$feedItem',
                        category: '$feedItemDetails.category',
                        subCategory: '$feedItemDetails.subCategory'
                    },
                    totalQuantity: { $sum: '$quantity' },
                    totalCost: { $sum: '$totalCost' }
                }
            }
        ]);

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Feed Templates Routes
router.get('/templates', async (req, res) => {
    try {
        const templates = await FeedTemplate.find()
            .populate('items.feedItem');
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/templates', async (req, res) => {
    try {
        const template = new FeedTemplate(req.body);
        const savedTemplate = await template.save();
        res.status(201).json(savedTemplate);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Analytics Routes
router.get('/analytics/feed-efficiency', async (req, res) => {
    try {
        const { startDate, endDate, cattle } = req.query;
        const query = {};
        
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (cattle) query.cattle = cattle;

        const feedData = await DailyFeedLog.find(query)
            .populate('feedItem')
            .populate('cattle');

        // Calculate feed efficiency metrics
        const efficiencyData = feedData.reduce((acc, log) => {
            const cattleId = log.cattle[0]._id;
            if (!acc[cattleId]) {
                acc[cattleId] = {
                    totalFeedCost: 0,
                    totalFeedQuantity: 0,
                    weightGain: 0
                };
            }
            acc[cattleId].totalFeedCost += log.totalCost;
            acc[cattleId].totalFeedQuantity += log.quantity;
            return acc;
        }, {});

        res.json(efficiencyData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Export Routes
router.get('/export/monthly-summary', async (req, res) => {
    try {
        const { year, month } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const summary = await DailyFeedLog.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $lookup: {
                    from: 'feeditems',
                    localField: 'feedItem',
                    foreignField: '_id',
                    as: 'feedItemDetails'
                }
            },
            {
                $unwind: '$feedItemDetails'
            },
            {
                $group: {
                    _id: {
                        feedItem: '$feedItem',
                        category: '$feedItemDetails.category',
                        subCategory: '$feedItemDetails.subCategory'
                    },
                    totalQuantity: { $sum: '$quantity' },
                    totalCost: { $sum: '$totalCost' }
                }
            }
        ]);

        const fields = [
            'feedItem',
            'category',
            'subCategory',
            'totalQuantity',
            'totalCost'
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(summary);

        res.header('Content-Type', 'text/csv');
        res.attachment(`feed-summary-${year}-${month}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/export/daily-logs', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};
        
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const logs = await DailyFeedLog.find(query)
            .populate('feedItem')
            .populate('cattle')
            .sort({ date: -1 });

        const fields = [
            'date',
            'feedItem.name',
            'quantity',
            'unit',
            'unitPrice',
            'totalCost',
            'cattleGroup',
            'notes'
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(logs);

        res.header('Content-Type', 'text/csv');
        res.attachment(`feed-logs-${startDate}-to-${endDate}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 