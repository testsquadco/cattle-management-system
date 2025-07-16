const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Season = require('../models/Season');
const { auth } = require('../middleware/auth');

// Create a new season
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Season name is required'),
  body('startDate').isISO8601().withMessage('Start date is required'),
  body('endDate').isISO8601().withMessage('End date is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, startDate, endDate } = req.body;
    const season = new Season({ name, startDate, endDate });
    await season.save();
    res.status(201).json(season);
  } catch (error) {
    res.status(500).json({ message: 'Error creating season', error: error.message });
  }
});

// List all seasons
router.get('/', auth, async (req, res) => {
  try {
    const seasons = await Season.find().sort({ startDate: -1 });
    res.json(seasons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seasons', error: error.message });
  }
});

// Get a single season
router.get('/:id', auth, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    if (!season) return res.status(404).json({ message: 'Season not found' });
    res.json(season);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching season', error: error.message });
  }
});

// Close a season
router.put('/:id/close', auth, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    if (!season) return res.status(404).json({ message: 'Season not found' });
    if (season.isClosed) return res.status(400).json({ message: 'Season already closed' });
    season.isClosed = true;
    season.closedAt = new Date();
    await season.save();
    res.json(season);
  } catch (error) {
    res.status(500).json({ message: 'Error closing season', error: error.message });
  }
});

// Carry forward unsold cattle to the next season
router.post('/:id/carry-forward', auth, async (req, res) => {
  try {
    const closingSeason = await Season.findById(req.params.id);
    if (!closingSeason || !closingSeason.isClosed) {
      return res.status(400).json({ message: 'Season must be closed first.' });
    }
    // Try to find the next season (by startDate)
    let nextSeason = await Season.findOne({ startDate: { $gt: closingSeason.endDate } }).sort({ startDate: 1 });
    if (!nextSeason) {
      // Auto-create next season (e.g., increment year in name)
      const yearMatch = closingSeason.name.match(/(\d{4})/);
      let nextYear = yearMatch ? parseInt(yearMatch[1], 10) + 1 : new Date(closingSeason.endDate).getFullYear() + 1;
      let newName = closingSeason.name.replace(/\d{4}/, nextYear) || `Season ${nextYear}`;
      const newStartDate = new Date(closingSeason.endDate);
      newStartDate.setDate(newStartDate.getDate() + 1);
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + 10); // Default 10 months
      nextSeason = new Season({
        name: newName,
        startDate: newStartDate,
        endDate: newEndDate
      });
      await nextSeason.save();
    }
    // Set carriedForwardTo on the closed season
    closingSeason.carriedForwardTo = nextSeason._id;
    await closingSeason.save();

    // Find unsold cattle in the closing season (actualSalePrice == 0)
    const Cattle = require('../models/Cattle');
    const unsoldCattle = await Cattle.find({ season: closingSeason._id, actualSalePrice: { $eq: 0 } });
    const Expense = require('../models/Expense');
    const carriedCattle = [];

    for (const cow of unsoldCattle) {
      // Find cattle-specific expenses (not shared) for this cattle in the closing season
      const expenses = await Expense.find({
        cattle: cow._id,
        season: closingSeason._id,
        isSharedExpense: { $ne: true }
      });
      // Calculate cumulative cost (initial + individual expenses)
      const initialCost = (cow.purchasePrice || 0) + (cow.transportationCost || 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      // Create new cattle for next season
      const newCattle = new Cattle({
        ...cow.toObject(),
        _id: undefined,
        season: nextSeason._id,
        carryForwardFromSeason: closingSeason._id,
        totalExpenses,
        purchasePrice: initialCost, // Carry forward as new initial cost
        transportationCost: 0, // Not carried forward
        actualSalePrice: 0,
        saleDate: null,
        profitLoss: 0,
        createdAt: undefined,
        updatedAt: undefined
      });
      await newCattle.save();
      carriedCattle.push(newCattle);
    }
    res.json({ message: 'Carry forward complete.', nextSeason, carriedCattle });
  } catch (error) {
    res.status(500).json({ message: 'Error carrying forward cattle', error: error.message });
  }
});

// Delete a season (only if closed)
router.delete('/:id', auth, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    if (!season) return res.status(404).json({ message: 'Season not found' });
    if (!season.isClosed) return res.status(400).json({ message: 'Cannot delete an active season' });

    // Delete all cattle and expenses associated with this season
    await require('../models/Cattle').deleteMany({ season: season._id });
    await require('../models/Expense').deleteMany({ season: season._id });

    await Season.findByIdAndDelete(season._id);
    res.json({ message: 'Season and associated data deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting season', error: error.message });
  }
});

module.exports = router; 