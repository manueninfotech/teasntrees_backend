// Customer Product Controller
// Public access to browse products

import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { isProductInSeason, getCurrentMonth } from '../../utils/seasonUtils.js';

// Simple in-memory cache for product listings
// TTL: 5 seconds (short enough to feel real-time, long enough for load tests)
const productCache = new Map();
const CACHE_TTL = 5000;

const getCachedResponse = (key) => {
    const cached = productCache.get(key);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }
    return null;
};

const setCachedResponse = (key, data) => {
    productCache.set(key, { data, timestamp: Date.now() });
    // Cleanup old entries if cache grows too large
    if (productCache.size > 1000) {
        const firstKey = productCache.keys().next().value;
        productCache.delete(firstKey);
    }
};

// Clear cache (can be exported and used in other controllers on update)
export const clearProductCache = () => productCache.clear();

// Get all products (with pagination, search, filter)
export const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search, q, tags } = req.query;

        // Check cache first
        const cacheKey = `all:${req.activeBrand}:${page}:${limit}:${category}:${search}:${q}:${tags}`;
        const cachedData = getCachedResponse(cacheKey);
        if (cachedData) return res.json(cachedData);

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
        const currentMonth = getCurrentMonth();

        // High performance indexed query (after migration)
        query.availableMonths = currentMonth;

        // Execute count and find in parallel with .lean() for performance
        const [products, totalProducts] = await Promise.all([
            Product.find(query)
                .populate('category', 'name description icon')
                .select('-__v -ingredients -allergens -createdBy -description') // Minimized payload
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            Product.countDocuments(query)
        ]);

        const responseData = {
            success: true,
            data: {
                products: products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    limit: parseInt(limit)
                }
            }
        };

        // Cache the result
        setCachedResponse(cacheKey, responseData);

        res.json(responseData);
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
        const { id } = req.params;

        const cacheKey = `prod:${id}`;
        const cachedData = getCachedResponse(cacheKey);
        if (cachedData) return res.json(cachedData);

        const currentMonth = getCurrentMonth();

        const product = await Product.findOne({
            _id: id,
            isAvailable: true,
            $or: [
                { isSeasonal: false },
                { availableMonths: currentMonth }
            ]
        })
            .select(
                'name description image brand price cakePricing sizeOptions averageRating totalRatings orderCount category createdAt'
            )
            .populate('category', 'name description icon')
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not available'
            });
        }

        const responseData = {
            success: true,
            data: product
        };

        setCachedResponse(cacheKey, responseData);

        return res.json(responseData);

    } catch (error) {
        console.error('Error in getProductById:', error);
        return res.status(500).json({
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

        // Check cache
        const cacheKey = `cat:${categoryId}:${req.activeBrand}:${page}:${limit}`;
        const cachedData = getCachedResponse(cacheKey);
        if (cachedData) return res.json(cachedData);

        const skip = (page - 1) * limit;

        const query = {
            category: categoryId,
            isAvailable: true
        };

        if (req.activeBrand) {
            query.brand = req.activeBrand;
        }

        const currentMonth = getCurrentMonth();

        // High performance indexed query
        query.availableMonths = currentMonth;

        // Execute count and find in parallel with .lean()
        const [products, totalProducts] = await Promise.all([
            Product.find(query)
                .populate('category', 'name description icon')
                .select('-__v -ingredients -allergens -createdBy')
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            Product.countDocuments(query)
        ]);

        const fixedProducts = products.map(fixLeanImage);

        const responseData = {
            success: true,
            data: {
                products: fixedProducts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts
                }
            }
        };

        setCachedResponse(cacheKey, responseData);

        res.json(responseData);
    } catch (error) {
        console.error('Error in getProductsByCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
};
