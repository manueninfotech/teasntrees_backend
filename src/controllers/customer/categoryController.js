// Customer Category Controller
// Public access to browse categories

import Category from '../../models/Category.js';

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const query = { isActive: true };

        if (req.activeBrand) {
            query.brand = req.activeBrand;
        }

        const categories = await Category.find(query)
            .select('-__v')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error in getAllCategories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
};

// Get single category by ID
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category || !category.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error in getCategoryById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category'
        });
    }
};
