import Category from "../../models/Category.js";

// Get all categories for the active brand
export const getAllCategories = async (req, res) => {
    try {
        const brand = req.activeBrand || req.params.brand || 'littleh';
        const categories = await Category.find({ brand }).sort({ displayOrder: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};
