// Customer Product Controller
// Public access to browse products

import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { isProductInSeason, getCurrentMonth } from '../../utils/seasonUtils.js';

// Get all products (with pagination, search, filter)
export const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search, q, tags } = req.query;

        const query = { isAvailable: true };

        if (req.activeBrand) {
            query.brand = req.activeBrand;
        }

        // 1. Filter by category
        if (category) {
            const mongoose = await import('mongoose');
            if (mongoose.default.Types.ObjectId.isValid(category)) {
                query.category = category;
            } else {
                const categoryDoc = await Category.findOne({
                    name: { $regex: new RegExp(`^${category}$`, 'i') }
                });
                if (categoryDoc) {
                    query.category = categoryDoc._id;
                } else {
                    return res.json({
                        success: true,
                        data: { products: [], pagination: { currentPage: parseInt(page), totalPages: 0, totalProducts: 0, limit: parseInt(limit) } }
                    });
                }
            }
        }

        // 2. Combined search query (Global 'q' + Local 'search')
        const applySearch = async (term) => {
            if (!term) return null;
            const matchingCategories = await Category.find({
                name: { $regex: term, $options: 'i' }
            }).select('_id');
            const categoryIds = matchingCategories.map(cat => cat._id);

            return {
                $or: [
                    { name: { $regex: term, $options: 'i' } },
                    { category: { $in: categoryIds } }
                ]
            };
        };

        const searchConditions = [];
        const qCondition = await applySearch(q);
        if (qCondition) searchConditions.push(qCondition);

        const localCondition = await applySearch(search);
        if (localCondition) searchConditions.push(localCondition);

        if (searchConditions.length > 0) {
            query.$and = searchConditions;
        }

        // Filter by tags
        if (tags) {
            const tagArray = tags.split(',');
            query.tags = { $in: tagArray };
        }

        const skip = (page - 1) * limit;

        let products = await Product.find(query)
            .populate('category', 'name description icon')
            .select('-__v')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        // Filter out seasonal products that are not in season
        products = products.filter(product => isProductInSeason(product));

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

        // Check if product is in season
        if (!isProductInSeason(product)) {
            return res.status(404).json({
                success: false,
                message: 'Product not available in current season'
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

        const query = {
            category: categoryId,
            isAvailable: true
        };

        if (req.activeBrand) {
            query.brand = req.activeBrand;
        }

        let products = await Product.find(query)
            .populate('category', 'name description icon')
            .limit(parseInt(limit))
            .skip(skip);

        // Filter out seasonal products that are not in season
        products = products.filter(product => isProductInSeason(product));

        const totalProducts = await Product.countDocuments(query);

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
