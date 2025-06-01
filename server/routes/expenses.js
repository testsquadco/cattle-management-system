const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Cattle = require('../models/Cattle');
const Category = require('../models/Category');
const CustodyIncome = require('../models/CustodyIncome');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get all expenses
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, cattleId, categoryId } = req.query;
        const query = {};

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (cattleId) {
            query.cattle = cattleId;
        }

        if (categoryId) {
            query.category = categoryId;
        }

        const expenses = await Expense.find(query)
            .populate({
                path: 'cattle',
                select: 'tag breed'
            })
            .populate('category', 'name type')
            .sort({ date: -1 });

        // Transform the response to handle shared expenses
        const transformedExpenses = expenses.map(expense => {
            const expenseObj = expense.toObject();
            
            // If it's a shared expense (multiple cattle)
            if (expenseObj.isSharedExpense) {
                expenseObj.cattleDisplay = `All Cattle (${expenseObj.totalCattleCount})`;
            } else if (Array.isArray(expenseObj.cattle)) {
                // Single cattle case
                const cattle = expenseObj.cattle[0];
                expenseObj.cattleDisplay = cattle ? `${cattle.tag} - ${cattle.breed}` : '-';
            }

            return expenseObj;
        });

        res.json(transformedExpenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses', error: error.message });
    }
});

// Get expense summary
router.get('/summary', auth, async (req, res) => {
    try {
        const { startDate, endDate, cattleId } = req.query;
        
        // Base query for cattle filtering
        const baseQuery = cattleId ? { cattle: mongoose.Types.ObjectId(cattleId) } : {};

        // Fetch all cattle with their saleDate and actualSalePrice
        const allCattleDocs = await Cattle.find({}, '_id saleDate actualSalePrice');
        const cattleSaleMap = allCattleDocs.reduce((map, c) => {
            map[c._id.toString()] = {
                saleDate: c.saleDate,
                actualSalePrice: c.actualSalePrice
            };
            return map;
        }, {});

        // Get all expenses (including farm setup), but exclude post-sale expenses for sold cattle
        const allExpenses = await Expense.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $match: baseQuery
            },
            {
                $addFields: {
                    cattleId: { $arrayElemAt: ['$cattle', 0] }
                }
            },
            {
                $lookup: {
                    from: 'cattles',
                    localField: 'cattleId',
                    foreignField: '_id',
                    as: 'cattleDoc'
                }
            },
            {
                $addFields: {
                    cattleSaleDate: { $arrayElemAt: ['$cattleDoc.saleDate', 0] },
                    cattleActualSalePrice: { $arrayElemAt: ['$cattleDoc.actualSalePrice', 0] }
                }
            },
            {
                $match: {
                    $or: [
                        { cattleSaleDate: null },
                        { cattleActualSalePrice: { $lte: 0 } },
                        { $expr: { $lte: ['$date', '$cattleSaleDate'] } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: '$amount' }
                }
            }
        ]);

        // Get farm setup expenses (exclude post-sale expenses for sold cattle)
        const farmSetupExpenses = await Expense.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $match: baseQuery
            },
            {
                $addFields: {
                    cattleId: { $arrayElemAt: ['$cattle', 0] }
                }
            },
            {
                $lookup: {
                    from: 'cattles',
                    localField: 'cattleId',
                    foreignField: '_id',
                    as: 'cattleDoc'
                }
            },
            {
                $addFields: {
                    cattleSaleDate: { $arrayElemAt: ['$cattleDoc.saleDate', 0] },
                    cattleActualSalePrice: { $arrayElemAt: ['$cattleDoc.actualSalePrice', 0] }
                }
            },
            {
                $match: {
                    'categoryDetails.name': 'Farm Setup',
                    $or: [
                        { cattleSaleDate: null },
                        { cattleActualSalePrice: { $lte: 0 } },
                        { $expr: { $lte: ['$date', '$cattleSaleDate'] } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalFarmSetupExpenses: { $sum: '$amount' }
                }
            }
        ]);

        // Get operational expenses (excluding farm setup) grouped by month (exclude post-sale expenses for sold cattle)
        const operationalExpenses = await Expense.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $match: baseQuery
            },
            {
                $addFields: {
                    cattleId: { $arrayElemAt: ['$cattle', 0] }
                }
            },
            {
                $lookup: {
                    from: 'cattles',
                    localField: 'cattleId',
                    foreignField: '_id',
                    as: 'cattleDoc'
                }
            },
            {
                $addFields: {
                    cattleSaleDate: { $arrayElemAt: ['$cattleDoc.saleDate', 0] },
                    cattleActualSalePrice: { $arrayElemAt: ['$cattleDoc.actualSalePrice', 0] }
                }
            },
            {
                $match: {
                    'categoryDetails.name': { $ne: 'Farm Setup' },
                    $or: [
                        { cattleSaleDate: null },
                        { cattleActualSalePrice: { $lte: 0 } },
                        { $expr: { $lte: ['$date', '$cattleSaleDate'] } }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    monthlyTotal: { $sum: '$amount' }
                }
            },
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1
                }
            }
        ]);

        // Get total cattle count (owned + custody)
        const totalCattle = await Cattle.countDocuments({
            $or: [
                { custodyType: 'Owned' },
                { custodyType: 'Custody' }
            ]
        });

        // Get current month's operational expenses
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        const currentMonthExpenses = await Expense.aggregate([
            {
                $match: {
                    date: {
                        $gte: firstDayOfMonth,
                        $lt: firstDayOfNextMonth
                    }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $match: {
                    'categoryDetails.name': { $ne: 'Farm Setup' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Calculate monthly average per cattle (current month only)
        const currentMonthTotal = currentMonthExpenses[0]?.totalAmount || 0;
        const monthlyAvgPerCattle = totalCattle > 0 ? currentMonthTotal / totalCattle : 0;

        // Calculate average expense per cattle (all time)
        const totalOperationalExpenses = operationalExpenses.reduce((sum, month) => sum + month.monthlyTotal, 0);
        const avgExpensePerCattle = totalCattle > 0 ? totalOperationalExpenses / totalCattle : 0;

        // Prepare the response
        const response = {
            totalExpenses: allExpenses[0]?.totalExpenses || 0,
            totalOperationalExpenses: (allExpenses[0]?.totalExpenses || 0) - (farmSetupExpenses[0]?.totalFarmSetupExpenses || 0),
            averageExpense: totalOperationalExpenses / (operationalExpenses.length || 1),
            totalFarmSetupExpenses: farmSetupExpenses[0]?.totalFarmSetupExpenses || 0,
            averagePerCattle: Math.round(avgExpensePerCattle * 10) / 10,
            averagePerCattleMonthly: Math.round(monthlyAvgPerCattle * 10) / 10,
            debug: {
                totalOperationalExpenses,
                currentMonthTotal,
                totalCattle,
                monthlyBreakdown: operationalExpenses
            }
        };

        console.log('Expense Summary Response:', response);
        res.json(response);
    } catch (error) {
        console.error('Error in /summary:', error);
        res.status(500).json({ message: 'Error fetching expense summary', error: error.message });
    }
});

// Get expenses by cattle ID
router.get('/cattle/:cattleId', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ cattle: req.params.cattleId })
            .populate('category', 'name type')
            .sort({ date: -1 });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses for cattle', error: error.message });
    }
});

// Get single expense
router.get('/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('cattle', 'name')
            .populate('category', 'name type');

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expense', error: error.message });
    }
});

// Add new expense
router.post('/', [
    auth,
    body('cattle').optional({ nullable: true }).custom(value => {
        if (value === '' || value === null || value === undefined) return true;
        if (value === 'all') return true;
        if (Array.isArray(value)) {
            return value.every(id => mongoose.Types.ObjectId.isValid(id));
        }
        return mongoose.Types.ObjectId.isValid(value);
    }),
    body('category').isMongoId(),
    body('amount').isNumeric().isFloat({ min: 0 }),
    body('date').isISO8601().toDate(),
    body('description').optional().trim(),
    body('receipt').optional().trim(),
    body('contributor').isIn(['Eliya', 'Kumail']).withMessage('Contributor must be either Eliya or Kumail'),
    body('quantity').optional({ nullable: true }).custom((value) => {
        if (value === '' || value === null || value === undefined) return true;
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
    }),
    body('unit').optional({ nullable: true })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Ensure date is in correct format
        const date = new Date(req.body.date);
        if (isNaN(date.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }
        req.body.date = date;

        const { cattle, category, subCategory, amount, description, receipt, quantity, unit, contributor } = req.body;

        // Check if category requires quantity and unit
        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Only validate quantity and unit for Feed and Vaccine categories
        if (['Feed', 'Vaccine'].includes(categoryDoc.name)) {
            if (!quantity || quantity <= 0) {
                return res.status(400).json({ message: `Quantity is required for ${categoryDoc.name} category` });
            }
            if (!unit) {
                return res.status(400).json({ message: `Unit is required for ${categoryDoc.name} category` });
            }
        }

        // For no cattle or specific cattle case
        let cattleId = [];  // Initialize as empty array instead of null
        let isSharedExpense = false;
        let totalCattleCount = 0;
        if (cattle && cattle !== '') {
            if (cattle === 'all') {
                // Get all active cattle (exclude sold cattle with saleDate before expense date)
                const allCattle = await Cattle.find({
                    $or: [
                        { custodyType: 'Owned' },
                        { custodyType: 'Custody' },
                        { custodyType: 'Sold', $or: [ { saleDate: null }, { saleDate: { $gt: date } } ] }
                    ]
                });
                if (allCattle.length === 0) {
                    return res.status(400).json({ message: 'No cattle found to assign expense to' });
                }
                cattleId = allCattle.map(c => c._id);
                isSharedExpense = true;
                totalCattleCount = allCattle.length;
                
                const expense = new Expense({
                    cattle: cattleId,
                    category,
                    subCategory: subCategory || undefined,
                    amount,
                    date,
                    description,
                    receipt,
                    quantity: quantity || undefined,
                    unit: unit || undefined,
                    isSharedExpense: isSharedExpense,
                    totalCattleCount: totalCattleCount,
                    contributor
                });

                await expense.save();
                return res.status(201).json(expense);
            } else if (Array.isArray(cattle)) {
                // Validate all cattle IDs
                const foundCattle = await Cattle.find({ _id: { $in: cattle } });
                if (foundCattle.length !== cattle.length) {
                    return res.status(404).json({ message: 'One or more selected cattle not found' });
                }
                cattleId = cattle;
                isSharedExpense = true;
                totalCattleCount = cattle.length;
            } else {
                // Single cattle
                const cattleExists = await Cattle.findById(cattle);
                if (!cattleExists) {
                    return res.status(404).json({ message: 'Cattle not found' });
                }
                cattleId = [cattle];
            }
        }

        const expense = new Expense({
            cattle: cattleId,  // Will be empty array if no cattle specified
            category,
            subCategory: subCategory || undefined,
            amount,
            date,
            description,
            receipt,
            quantity: quantity || undefined,
            unit: unit || undefined,
            isSharedExpense: isSharedExpense || false,
            totalCattleCount: totalCattleCount || cattleId.length || undefined,
            contributor
        });

        await expense.save();
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Error creating expense', error: error.message });
    }
});

// Update expense
router.put('/:id', [
    auth,
    body('cattle').optional({ nullable: true }).custom(value => {
        if (value === '' || value === null || value === undefined) return true;
        if (value === 'all') return true;
        if (Array.isArray(value)) {
            return value.every(id => mongoose.Types.ObjectId.isValid(id));
        }
        return mongoose.Types.ObjectId.isValid(value);
    }),
    body('category').optional().isMongoId(),
    body('amount').optional().isNumeric().isFloat({ min: 0 }),
    body('date').optional().isISO8601().toDate(),
    body('description').optional().trim(),
    body('receipt').optional().trim(),
    body('quantity').optional({ nullable: true }).custom((value) => {
        if (value === '' || value === null || value === undefined) return true;
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
    }),
    body('unit').optional({ nullable: true })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Ensure date is in correct format if provided
        if (req.body.date) {
            const parsedDate = new Date(req.body.date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date format' });
            }
            // Keep the date in local timezone without UTC conversion
            req.body.date = parsedDate;
        }

        // If category is being updated, validate subcategory
        if (req.body.category) {
            const categoryExists = await Category.findById(req.body.category);
            if (!categoryExists) {
                return res.status(404).json({ message: 'Category not found' });
            }

            // Only validate subcategory if the category has subcategories
            if (categoryExists.subCategories && categoryExists.subCategories.length > 0) {
                if (!req.body.subCategory || !req.body.subCategory.trim()) {
                    return res.status(400).json({ message: 'Subcategory is required for this category' });
                }
                if (!categoryExists.subCategories.includes(req.body.subCategory)) {
                    return res.status(400).json({ message: 'Invalid subcategory for this category' });
                }
            } else {
                // If category has no subcategories, remove any existing subcategory
                req.body.subCategory = undefined;
            }
        }

        // If category doesn't require quantity (not Feed or Vaccine), remove quantity and unit
        const category = await Category.findById(req.body.category || (await Expense.findById(req.params.id)).category);
        if (category && !['Feed', 'Vaccine'].includes(category.name)) {
            req.body.quantity = undefined;
            req.body.unit = undefined;
        }

        // Handle "all" cattle case for updates
        if (req.body.cattle === 'all') {
            const allCattle = await Cattle.find();
            if (allCattle.length === 0) {
                return res.status(400).json({ message: 'No cattle found to assign expense to' });
            }
            req.body.cattle = allCattle.map(c => c._id);
            req.body.isSharedExpense = true;
            req.body.totalCattleCount = allCattle.length;
        } else if (req.body.cattle) {
            // If updating to a specific cattle, remove shared expense flags
            req.body.isSharedExpense = false;
            req.body.totalCattleCount = undefined;
        }

        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Error updating expense', error: error.message });
    }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting expense', error: error.message });
    }
});

module.exports = router; 