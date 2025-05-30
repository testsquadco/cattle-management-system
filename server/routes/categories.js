const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { auth } = require('../middleware/auth');

// Get all categories
router.get('/', auth, async (req, res) => {
    try {
        const categories = await Category.find()
            .select('name type description subCategories isActive')
            .sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
});

// Get single category
router.get('/:id', auth, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching category', error: error.message });
    }
});

// Add new category
router.post('/', [
    auth,
    body('name').trim().notEmpty(),
    body('type').trim().notEmpty(),
    body('description').optional().trim(),
    body('subCategories').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, type, description, subCategories } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = new Category({
            name,
            type,
            description,
            subCategories: subCategories || []
        });

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error creating category', error: error.message });
    }
});

// Update category
router.put('/:id', [
    auth,
    body('name').optional().trim().notEmpty(),
    body('type').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('subCategories').optional().isArray(),
    body('isActive').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error: error.message });
    }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
});

// Get subcategories by type
router.get('/type/:type/subcategories', auth, async (req, res) => {
    try {
        const categories = await Category.find({ type: req.params.type });
        const allSubCategories = categories.reduce((acc, cat) => [...acc, ...(cat.subCategories || [])], []);
        res.json([...new Set(allSubCategories)]); // Remove duplicates
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
    }
});

// Add subcategory to a category
router.post('/:id/subcategories', [
    auth,
    body('name').trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const { name } = req.body;
        
        // Check if subcategory already exists
        if (category.subCategories.includes(name)) {
            return res.status(400).json({ message: 'Subcategory already exists' });
        }

        // Add new subcategory
        category.subCategories.push(name);
        await category.save();

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error adding subcategory', error: error.message });
    }
});

// Remove subcategory from a category
router.delete('/:id/subcategories/:subcategory', auth, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const subcategoryIndex = category.subCategories.indexOf(req.params.subcategory);
        if (subcategoryIndex === -1) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        category.subCategories.splice(subcategoryIndex, 1);
        await category.save();

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error removing subcategory', error: error.message });
    }
});

module.exports = router; 