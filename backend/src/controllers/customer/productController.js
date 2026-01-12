// Customer Product Controller
// Public access to browse products

import Product from '../../models/Product.js';
import Category from '../../models/Category.js';

// Get all products (with pagination, search, filter)
export const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search, tags } = req.query;

        const query = { isAvailable: true }; // Only show available products to customers

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by tags
        if (tags) {
            const tagArray = tags.split(',');
            query.tags = { $in: tagArray };
        }

        const skip = (page - 1) * limit;

        const products = await Product.find(query)
            .populate('category', 'name description icon')
            .select('-__v')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalProducts = await Product.countDocuments(query);

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
};

// Get single product by ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name description icon');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Only show if available
        if (!product.isAvailable) {
            return res.status(404).json({
                success: false,
                message: 'Product not available'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error in getProductById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const products = await Product.find({
            category: categoryId,
            isAvailable: true
        })
            .populate('category', 'name description icon')
            .limit(parseInt(limit))
            .skip(skip);

        const totalProducts = await Product.countDocuments({
            category: categoryId,
            isAvailable: true
        });

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts
                }
            }
        });
    } catch (error) {
        console.error('Error in getProductsByCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
};
