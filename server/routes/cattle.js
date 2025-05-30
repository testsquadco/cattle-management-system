const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Cattle = require('../models/Cattle');
const Expense = require('../models/Expense');
const { auth } = require('../middleware/auth');
const Weight = require('../models/Weight');
const mongoose = require('mongoose');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Get all cattle
router.get('/', auth, async (req, res) => {
    try {
        const cattle = await Cattle.find().sort({ tag: 1 });
        
        // Get latest weights for all cattle
        const weights = await Promise.all(
            cattle.map(async (cow) => {
                const latestWeight = await Weight.findOne({ cattle: cow._id })
                    .sort({ date: -1 })
                    .select('weight date');
                return {
                    cattleId: cow._id,
                    latestWeight: latestWeight ? latestWeight.weight : cow.weight // fallback to purchase weight
                };
            })
        );

        // Create a map of cattle ID to latest weight
        const weightMap = weights.reduce((map, item) => {
            map[item.cattleId] = item.latestWeight;
            return map;
        }, {});

        // Add latest weight to each cattle object
        const cattleWithWeights = cattle.map(cow => {
            const cowObj = cow.toObject();
            cowObj.currentWeight = weightMap[cow._id] || cow.weight; // fallback to purchase weight
            return cowObj;
        });

        res.json(cattleWithWeights);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cattle', error: error.message });
    }
});

// Get single cattle
router.get('/:id', auth, async (req, res) => {
    try {
        const cattle = await Cattle.findById(req.params.id);
        if (!cattle) {
            return res.status(404).json({ message: 'Cattle not found' });
        }

        // Get total number of cattle
        const totalCattleCount = await Cattle.countDocuments();

        // Calculate total expenses excluding Farm Setup and divide by total cattle
        const expenseStats = await Expense.aggregate([
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
                    totalExpenses: { $sum: '$amount' }
                }
            }
        ]);

        // Calculate per cattle expense
        const totalExpenses = expenseStats.length > 0 ? expenseStats[0].totalExpenses : 0;
        const perCattleExpense = totalCattleCount > 0 ? totalExpenses / totalCattleCount : 0;

        // Calculate initial cost for this specific cattle
        const initialCost = (cattle.purchasePrice || 0) + (cattle.transportationCost || 0);

        // Calculate total investment (initial cost + per cattle expense share)
        const totalInvestment = initialCost + perCattleExpense;

        // Add calculated values to cattle object
        const cattleWithStats = cattle.toObject();
        cattleWithStats.totalExpenses = perCattleExpense;
        cattleWithStats.totalInvestment = totalInvestment;
        cattleWithStats.initialCost = initialCost;

        console.log('Cattle stats:', {
            cattleId: cattle._id,
            purchasePrice: cattle.purchasePrice,
            transportationCost: cattle.transportationCost,
            initialCost,
            totalExpenses: perCattleExpense,
            totalInvestment,
            totalCattleCount
        });

        res.json(cattleWithStats);
    } catch (error) {
        console.error('Error fetching cattle:', error);
        res.status(500).json({ message: 'Error fetching cattle', error: error.message });
    }
});

// Add new cattle
router.post('/', [
    auth,
    upload.single('image'),
    body('tag')
        .trim()
        .notEmpty().withMessage('Tag is required')
        .custom(async value => {
            const existingCattle = await Cattle.findOne({ tag: value });
            if (existingCattle) {
                throw new Error('Tag must be unique');
            }
            return true;
        }),
    body('breed')
        .trim()
        .notEmpty().withMessage('Breed is required'),
    body('gender')
        .isIn(['Male', 'Female']).withMessage('Gender must be either Male or Female'),
    body('purchaseDate')
        .isISO8601().withMessage('Purchase date must be a valid date'),
    body('weight')
        .isNumeric().withMessage('Weight must be a number')
        .isFloat({ min: 0 }).withMessage('Weight must be greater than 0'),
    body('purchasePrice')
        .isNumeric().withMessage('Purchase price must be a number')
        .isFloat({ min: 0 }).withMessage('Purchase price must be greater than 0'),
    body('colorMarkings')
        .optional()
        .trim(),
    body('expectedSalePrice')
        .optional()
        .isNumeric().withMessage('Expected sale price must be a number')
        .isFloat({ min: 0 }).withMessage('Expected sale price must be greater than 0'),
    body('notes')
        .optional()
        .trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // If there's an uploaded file but validation failed, delete it
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ errors: errors.array() });
        }

        // Check for duplicate tag again (race condition protection)
        const existingCattle = await Cattle.findOne({ tag: req.body.tag });
        if (existingCattle) {
            // If there's an uploaded file but tag is duplicate, delete it
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: 'Tag must be unique' });
        }

        // Create cattle with image filename if uploaded
        const cattleData = {
            ...req.body,
            image: req.file ? req.file.filename : ''
        };

        const cattle = new Cattle(cattleData);
        await cattle.save();
        res.status(201).json(cattle);
    } catch (error) {
        // If there's an uploaded file but error occurred, delete it
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error creating cattle', error: error.message });
    }
});

// Update cattle
router.put('/:id', [
    auth,
    upload.single('image'),
    // Remove custodyDetails from validation since we'll handle it manually
    body('tag').optional().trim().notEmpty().withMessage('Tag cannot be empty'),
    body('breed').optional().trim().notEmpty().withMessage('Breed cannot be empty'),
    body('gender').optional().isIn(['Male', 'Female']).withMessage('Gender must be either Male or Female'),
    body('purchaseDate').optional().isISO8601().withMessage('Purchase date must be a valid date'),
    body('weight').optional().isNumeric().withMessage('Weight must be a number'),
    body('purchasePrice').optional().isNumeric().withMessage('Purchase price must be a number'),
    body('colorMarkings').optional().trim(),
    body('expectedSalePrice')
        .optional()
        .if((value) => value !== null && value !== undefined && value !== '')
        .isNumeric().withMessage('Expected sale price must be a number')
        .isFloat({ min: 0 }).withMessage('Expected sale price must be greater than 0'),
    body('actualSalePrice')
        .optional()
        .if((value) => value !== null && value !== undefined && value !== '')
        .isNumeric().withMessage('Actual sale price must be a number')
        .isFloat({ min: 0 }).withMessage('Actual sale price must be greater than 0'),
    body('saleDate')
        .optional()
        .if((value, { req }) => {
            const actualSalePrice = parseFloat(req.body.actualSalePrice);
            return actualSalePrice > 0;
        })
        .isISO8601().withMessage('Sale date must be a valid date'),
    body('notes').optional().trim(),
    body('custodyType').optional().isIn(['Owned', 'Custody', 'Sold']).withMessage('Custody type must be either Owned, Custody, or Sold'),
    body('purpose').optional().isIn(['For Sale', 'Breeding']).withMessage('Purpose must be either For Sale or Breeding')
], async (req, res) => {
    try {
        // Log initial request data with detailed type information
        console.log('=== INITIAL REQUEST DATA ===');
        console.log('Raw body:', JSON.stringify(req.body, null, 2));
        console.log('File:', req.file ? {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        } : null);

        // Helper function to log detailed field information
        const logFieldDetails = (data, prefix = '') => {
            console.log(`\n=== ${prefix}FIELD DETAILS ===`);
            Object.entries(data).forEach(([key, value]) => {
                console.log(`\nField: ${key}`);
                console.log('Type:', typeof value);
                console.log('Value:', value);
                console.log('Is Object:', value && typeof value === 'object');
                console.log('Is Array:', Array.isArray(value));
                console.log('Stringified:', JSON.stringify(value));
                if (value && typeof value === 'object') {
                    console.log('Object keys:', Object.keys(value));
                }
            });
        };

        // First, handle custodyDetails before any other parsing
        if (req.body.custodyDetails) {
            try {
                // If it's a string "[object Object]", try to get the actual object from the request
                if (req.body.custodyDetails === '[object Object]') {
                    const custodyFields = [
                        'ownerName',
                        'ownerContact',
                        'monthlyFee',
                        'startDate',
                        'endDate',
                        'notes'
                    ];
                    
                    const parsedCustodyDetails = {};
                    let hasValidFields = false;

                    custodyFields.forEach(field => {
                        const fieldValue = req.body[`custodyDetails.${field}`];
                        if (fieldValue !== undefined && fieldValue !== '') {
                            hasValidFields = true;
                            if (field === 'monthlyFee') {
                                parsedCustodyDetails[field] = parseFloat(fieldValue);
                            } else if (field === 'startDate' || field === 'endDate') {
                                parsedCustodyDetails[field] = new Date(fieldValue);
                            } else {
                                parsedCustodyDetails[field] = fieldValue;
                            }
                        }
                    });

                    // Only set custodyDetails if we have valid fields
                    if (hasValidFields) {
                        req.body.custodyDetails = parsedCustodyDetails;
                    } else {
                        delete req.body.custodyDetails;
                    }
                } else if (typeof req.body.custodyDetails === 'string') {
                    try {
                        req.body.custodyDetails = JSON.parse(req.body.custodyDetails);
                    } catch (e) {
                        delete req.body.custodyDetails;
                    }
                }
            } catch (error) {
                console.error('Error parsing custodyDetails:', error);
                delete req.body.custodyDetails;
            }
        }

        // Parse and sanitize numeric fields
        const numericFields = [
            'weight',
            'purchasePrice',
            'transportationCost',
            'expectedSalePrice',
            'actualSalePrice',
            'profitLoss',
            'numberOfOffspring',
            'totalExpenses',
            'dailyFeedKg',
            'expensePerOffspring',
            'currentWeight'
        ];

        numericFields.forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                const parsedValue = parseFloat(req.body[field]);
                req.body[field] = isNaN(parsedValue) ? null : parsedValue;
            } else {
                req.body[field] = null;
            }
        });

        // Parse date fields
        const dateFields = [
            'purchaseDate',
            'saleDate',
            'createdAt',
            'updatedAt'
        ];

        dateFields.forEach(field => {
            if (req.body[field] && req.body[field] !== 'null') {
                const parsedDate = new Date(req.body[field]);
                req.body[field] = isNaN(parsedDate.getTime()) ? null : parsedDate;
            } else {
                req.body[field] = null;
            }
        });

        // Remove empty string values and system fields from request body
        const systemFields = ['_id', '__v', 'id', 'createdAt', 'updatedAt'];
        Object.keys(req.body).forEach(key => {
            if (req.body[key] === '' || systemFields.includes(key)) {
                delete req.body[key];
            }
        });

        // Log parsed data before validation
        console.log('\n=== PARSED DATA BEFORE VALIDATION ===');
        logFieldDetails(req.body, 'PRE-VALIDATION');

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('\n=== VALIDATION ERRORS ===');
            console.error(errors.array());
            // If there's an uploaded file but validation failed, delete it
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: errors.array() 
            });
        }

        // Get the current cattle to check for existing image
        const currentCattle = await Cattle.findById(req.params.id);
        if (!currentCattle) {
            // If there's an uploaded file but cattle not found, delete it
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ message: 'Cattle not found' });
        }

        // If new image is uploaded, delete the old one
        if (req.file && currentCattle.image) {
            const oldImagePath = path.join('server/public/uploads/cattle', currentCattle.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Update cattle with new image filename if uploaded
        const updateData = {
            ...req.body,
            image: req.file ? req.file.filename : currentCattle.image
        };

        // Calculate profitLoss if actualSalePrice and saleDate are present
        if (
            updateData.purpose === 'For Sale' &&
            updateData.actualSalePrice > 0 &&
            updateData.saleDate
        ) {
            // Always use the latest totalExpenses from the DB
            const totalExpenses = currentCattle.totalExpenses || 0;
            const purchasePrice = updateData.purchasePrice !== undefined ? updateData.purchasePrice : currentCattle.purchasePrice || 0;
            const transportationCost = updateData.transportationCost !== undefined ? updateData.transportationCost : currentCattle.transportationCost || 0;
            const totalInvestment = purchasePrice + transportationCost + totalExpenses;
            updateData.profitLoss = updateData.actualSalePrice - totalInvestment;
        }

        // Log final update data
        console.log('\n=== FINAL UPDATE DATA ===');
        logFieldDetails(updateData, 'FINAL');

        const cattle = await Cattle.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json(cattle);
    } catch (error) {
        // If there's an uploaded file but error occurred, delete it
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('\n=== UPDATE ERROR ===');
        console.error(error);
        res.status(500).json({ 
            message: 'Error updating cattle', 
            error: error.message 
        });
    }
});

// Delete cattle
router.delete('/:id', auth, async (req, res) => {
    try {
        const cattle = await Cattle.findById(req.params.id);
        if (!cattle) {
            return res.status(404).json({ message: 'Cattle not found' });
        }

        // Delete the associated image file if it exists
        if (cattle.image) {
            const imagePath = path.join('server/public/uploads/cattle', cattle.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Cattle.findByIdAndDelete(req.params.id);
        res.json({ message: 'Cattle deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting cattle', error: error.message });
    }
});

// Get cattle expenses summary
router.get('/:id/expenses', auth, async (req, res) => {
    try {
        const cattle = await Cattle.findById(req.params.id);
        if (!cattle) {
            return res.status(404).json({ message: 'Cattle not found' });
        }

        // Get initial cost (purchase price + transportation)
        const initialCost = cattle.purchasePrice + (cattle.transportationCost || 0);

        // Get all expenses for this cattle, excluding Farm Setup category
        const expenses = await Expense.aggregate([
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
                    cattle: mongoose.Types.ObjectId(req.params.id),
                    'categoryDetails.name': { $ne: 'Farm Setup' }
                }
            },
            {
                $project: {
                    amount: 1,
                    date: 1,
                    description: 1,
                    isSharedExpense: 1,
                    totalCattleCount: 1,
                    category: '$categoryDetails.name',
                    categoryType: '$categoryDetails.type',
                    effectiveAmount: {
                        $cond: [
                            '$isSharedExpense',
                            { $divide: ['$amount', '$totalCattleCount'] },
                            '$amount'
                        ]
                    }
                }
            },
            {
                $sort: { date: -1 }
            }
        ]);

        // Calculate total recurring expenses
        const totalRecurringExpenses = expenses.reduce((sum, expense) => sum + expense.effectiveAmount, 0);

        // Calculate total cost (initial + recurring)
        const totalCost = initialCost + totalRecurringExpenses;

        // Group expenses by category for breakdown
        const expensesByCategory = expenses.reduce((acc, expense) => {
            const category = expense.category;
            if (!acc[category]) {
                acc[category] = {
                    total: 0,
                    count: 0,
                    type: expense.categoryType
                };
            }
            acc[category].total += expense.effectiveAmount;
            acc[category].count++;
            return acc;
        }, {});

        res.json({
            cattle,
            expenses,
            summary: {
                initialCost,
                recurringExpenses: totalRecurringExpenses,
                totalCost,
                expensesByCategory
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cattle expenses', error: error.message });
    }
});

module.exports = router; 