import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import { uploadService } from "../../services/storage/upload.service.js";
import { SOCKET_EVENTS, SOCKET_ROOMS } from "../../sockets/socketEvents.js";
import { statsService } from "../../services/statsService.js";
import activityLogService from '../../services/activityLogService.js';
import { isLittlehCakeCategory } from '../../utils/cakeUtils.js';
import { clearProductCache } from '../customer/productController.js';

const parseNumberOrNull = (value) => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lowered = value.trim().toLowerCase();
        if (lowered === 'true') return true;
        if (lowered === 'false') return false;
    }
    return Boolean(value);
};

const normalizeCakePricing = (rawCakePricing = {}) => {
    let input = rawCakePricing || {};
    if (typeof rawCakePricing === 'string') {
        try {
            input = JSON.parse(rawCakePricing);
        } catch (error) {
            throw new Error('Invalid cakePricing payload');
        }
    }

    return {
        basePricePerKg: parseNumberOrNull(input.basePricePerKg),
        customizationAvailable: parseBoolean(input.customizationAvailable, false),
        customizationPricePerKg: parseNumberOrNull(input.customizationPricePerKg),
        egglessAvailable: parseBoolean(input.egglessAvailable, true),
        egglessExtraCharge: parseNumberOrNull(input.egglessExtraCharge) ?? 100
    };
};

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const { category, search, isAvailable, tags, brand } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order === 'desc' ? -1 : 1;
        const skip = (page - 1) * limit;
        // build query
        let query = {};
        if (category) {
            query.category = category;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable === 'true';
        }
        if (tags) {
            query.tags = { $in: tags.split(',') };
        }
        if (req.activeBrand) {
            query.brand = req.activeBrand;
        }

        const products = await Product.find(query)
            .populate('category', 'name icon')
            .sort({ [sortBy]: order })
            .limit(limit)
            .skip(skip);
        const total = await Product.countDocuments(query);
        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
            pagination: {
                current: page,
                totalPages: Math.ceil(total / limit),
                limit: limit,
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// Get single product by ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name icon description');
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.categoryId }).populate('category', 'name icon').sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products by category',
            error: error.message
        });
    }
};

// create new product
export const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            price,
            cakePricing,
            image,
            isAvailable,
            preparationTime,
            ingredients,
            allergens,
            tags,
            isSeasonal,
            availableMonths,
            sizeOptions,
            variants
        } = req.body;

        const brand = req.activeBrand;

        // verify category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const isLittlehCake = isLittlehCakeCategory({
            brand: brand || 'teasntrees',
            categoryName: categoryExists.name
        });

        const normalizedPrice = parseNumberOrNull(price);
        const normalizedCakePricing = normalizeCakePricing(cakePricing);
        const hasSizeOptions = Array.isArray(sizeOptions) && sizeOptions.length > 0;
        const hasCakePricing = normalizedCakePricing.basePricePerKg !== null;

        if (isLittlehCake) {
            if (!hasCakePricing) {
                return res.status(400).json({
                    success: false,
                    message: 'For littleh cakes, cakePricing.basePricePerKg is required'
                });
            }
            if (normalizedPrice !== null || hasSizeOptions) {
                return res.status(400).json({
                    success: false,
                    message: 'Littleh cakes must use only cakePricing. price/sizeOptions are not allowed'
                });
            }
            if (normalizedCakePricing.customizationAvailable && normalizedCakePricing.customizationPricePerKg === null) {
                return res.status(400).json({
                    success: false,
                    message: 'customizationPricePerKg is required when customizationAvailable is enabled'
                });
            }
            if (!normalizedCakePricing.customizationAvailable) {
                normalizedCakePricing.customizationPricePerKg = null;
            }
        } else {
            if (hasCakePricing) {
                return res.status(400).json({
                    success: false,
                    message: 'cakePricing is allowed only for littleh cake categories'
                });
            }
        }

        // Handle image upload
        let productImage = image; // Default to string URL from body
        if (req.file) {
            // If file uploaded, upload to Cloudinary
            const uploadResult = await uploadService.uploadPublicImage(req.file.buffer, 'products');
            productImage = uploadResult.url;
        }

        const product = await Product.create({
            name,
            description,
            brand: brand || 'teasntrees',
            category,
            price: normalizedPrice,
            cakePricing: hasCakePricing ? normalizedCakePricing : undefined,
            image: productImage,
            isAvailable,
            preparationTime,
            ingredients,
            allergens,
            tags,
            isSeasonal,
            availableMonths,
            sizeOptions,
            variants,
            createdBy: req.user.id
        });
        const populatedProduct = await Product.findById(product._id).populate('category', 'name icon');



        // Update Stats
        await statsService.increment('totalProducts');

        // Emit Socket.io event DIRECTLY
        const io = req.app.get('io');
        if (io) {
            const socketData = {
                productId: product._id,
                name: product.name,
                category: categoryExists.name,
                price: product.price,
                isAvailable: product.isAvailable,
                totalProducts: (await statsService.getStats()).totalProducts
            };
            // Broadcast to everyone (Customers need to see new product, Admin/Manager need stats)
            io.to(SOCKET_ROOMS.role('admin')).to(SOCKET_ROOMS.role('manager')).emit(SOCKET_EVENTS.PRODUCT_CREATED, socketData);
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'create',
            resource: 'product',
            resourceId: product._id,
            details: { name: product.name, price: product.price }
        });

        // Invalidate customer cache
        clearProductCache();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: populatedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        let targetCategory = null;
        if (req.body.category && req.body.category !== product.category.toString()) {
            targetCategory = await Category.findById(req.body.category);
            if (!targetCategory) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }
        } else {
            targetCategory = await Category.findById(product.category).select('name');
        }

        // Handle image upload/update
        if (req.file) {
            // Upload new image first (Blocking - required)
            const uploadResult = await uploadService.uploadPublicImage(req.file.buffer, 'products');

            // Delete old image from Cloudinary in background
            if (product.image && (product.image.includes('cloudinary.com') || product.image.includes('/products/'))) {
                const oldPublicId = uploadService.extractPublicId(product.image);
                if (oldPublicId) {
                    uploadService.deleteFile(oldPublicId).catch(err =>
                        console.error('Error deleting old image (background):', err)
                    );
                }
            }

            product.image = uploadResult.url;
        } else if (req.body.image) {
            // If image URL is provided in body (already uploaded to Cloudinary via frontend)
            product.image = req.body.image;
        }

        const incomingPrice = Object.prototype.hasOwnProperty.call(req.body, 'price')
            ? parseNumberOrNull(req.body.price)
            : product.price;
        const incomingSizeOptions = Object.prototype.hasOwnProperty.call(req.body, 'sizeOptions')
            ? req.body.sizeOptions
            : product.sizeOptions;
        const incomingCakePricing = Object.prototype.hasOwnProperty.call(req.body, 'cakePricing')
            ? normalizeCakePricing(req.body.cakePricing)
            : (product.cakePricing || {});

        const hasPrice = incomingPrice !== null && incomingPrice !== undefined;
        const hasSizeOptions = Array.isArray(incomingSizeOptions) && incomingSizeOptions.length > 0;
        const hasCakePricing = incomingCakePricing.basePricePerKg !== null && incomingCakePricing.basePricePerKg !== undefined;
        const pricingModesUsed = [hasPrice, hasSizeOptions, hasCakePricing].filter(Boolean).length;

        const isLittlehCake = isLittlehCakeCategory({
            brand: product.brand,
            categoryName: targetCategory?.name || ''
        });

        if (isLittlehCake) {
            if (!hasCakePricing) {
                return res.status(400).json({
                    success: false,
                    message: 'For littleh cakes, cakePricing.basePricePerKg is required'
                });
            }
            if (hasPrice || hasSizeOptions) {
                return res.status(400).json({
                    success: false,
                    message: 'Littleh cakes must use only cakePricing. price/sizeOptions are not allowed'
                });
            }
            if (incomingCakePricing.customizationAvailable && (incomingCakePricing.customizationPricePerKg === null || incomingCakePricing.customizationPricePerKg === undefined)) {
                return res.status(400).json({
                    success: false,
                    message: 'customizationPricePerKg is required when customizationAvailable is enabled'
                });
            }
            if (!incomingCakePricing.customizationAvailable) {
                incomingCakePricing.customizationPricePerKg = null;
            }
        } else if (hasCakePricing) {
            return res.status(400).json({
                success: false,
                message: 'cakePricing is allowed only for littleh cake categories'
            });
        }

        if (pricingModesUsed !== 1) {
            return res.status(400).json({
                success: false,
                message: 'Product must use exactly one pricing mode'
            });
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'price')) {
            req.body.price = incomingPrice;
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'cakePricing')) {
            req.body.cakePricing = hasCakePricing ? incomingCakePricing : undefined;
        }

        // update other fields
        Object.keys(req.body).forEach(key => {
            if (key !== 'image') { // Skip image as it's handled above
                product[key] = req.body[key];
            }
        });
        await product.save();
        const updatedProduct = await Product.findById(product._id).populate('category', 'name icon');



        // Emit Socket.io event DIRECTLY
        const io = req.app.get('io');
        if (io) {
            const socketData = {
                productId: product._id,
                name: product.name,
                isAvailable: product.isAvailable,
                price: product.price
            };
            io.to(SOCKET_ROOMS.role('admin')).to(SOCKET_ROOMS.role('manager')).emit(SOCKET_EVENTS.PRODUCT_UPDATED, socketData);
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'update',
            resource: 'product',
            resourceId: product._id,
            details: { name: product.name }
        });

        // Invalidate customer cache
        clearProductCache();

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const productData = { id: product._id, name: product.name };
        await product.deleteOne();

        // Delete image from Cloudinary in background (Non-blocking)
        if (product.image && (product.image.includes('cloudinary.com') || product.image.includes('/products/'))) {
            const publicId = uploadService.extractPublicId(product.image);
            if (publicId) {
                uploadService.deleteFile(publicId).catch(err =>
                    console.error('Error deleting image (background):', err)
                );
            }
        }

        // Update Stats
        await statsService.decrement('totalProducts');

        // Emit Socket.io event DIRECTLY
        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.role('admin')).to(SOCKET_ROOMS.role('manager')).emit(SOCKET_EVENTS.PRODUCT_DELETED, {
                ...productData,
                totalProducts: (await statsService.getStats()).totalProducts
            });
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'delete',
            resource: 'product',
            resourceId: productData.id,
            details: { name: productData.name }
        });

        // Invalidate customer cache
        clearProductCache();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

// Toggle product availability
export const toggleProductAvailability = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        product.isAvailable = !product.isAvailable;
        await product.save();

        // Log Activity
        await activityLogService.log(req, {
            action: product.isAvailable ? 'activate' : 'deactivate',
            resource: 'product',
            resourceId: product._id,
            details: { name: product.name }
        });

        // Invalidate customer cache
        clearProductCache();

        res.status(200).json({
            success: true,
            message: `Product ${product.isAvailable ? 'enabled' : 'disabled'} successfully`,
            data: product
        });

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            const socketData = {
                productId: product._id,
                name: product.name,
                isAvailable: product.isAvailable
            };
            socketService.notifyRole('customer', SOCKET_EVENTS.PRODUCT_UPDATED, socketData);
            socketService.notifyRole('manager', SOCKET_EVENTS.PRODUCT_UPDATED, socketData);
            socketService.notifyRole('admin', SOCKET_EVENTS.PRODUCT_UPDATED, socketData);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling product availability',
            error: error.message
        });
    }
};

// Bulk update products
export const bulkUpdateProducts = async (req, res) => {
    try {
        const { productIds, updates } = req.body;
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Product IDs array is required'
            });
        }
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Updates object is required'
            });
        }
        const result = await Product.updateMany({ _id: { $in: productIds } }, { $set: updates });

        // Log Activity
        await activityLogService.log(req, {
            action: 'update',
            resource: 'product',
            details: {
                type: 'bulk_update',
                count: result.modifiedCount,
                updates,
                productIds: productIds.slice(0, 5)
            }
        });
        // Invalidate customer cache
        clearProductCache();

        res.status(200).json({
            success: true,
            message: `Successfully updated ${result.modifiedCount} products`,
            data: {
                matched: result.matchedCount,
                modified: result.modifiedCount
            }
        });

        // Emit Socket.io event
        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.role('admin')).to(SOCKET_ROOMS.role('manager')).emit(SOCKET_EVENTS.PRODUCT_UPDATED, { bulk: true, productIds });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error bulk updating products',
            error: error.message
        });
    }
}

// Get all seasonal products
export const getSeasonalProducts = async (req, res) => {
    try {
        const query = { isSeasonal: true };
        if (req.activeBrand) query.brand = req.activeBrand;

        const products = await Product.find(query)
            .populate('category', 'name icon')
            .select('name isSeasonal availableMonths isAvailable category price image')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching seasonal products',
            error: error.message
        });
    }
};

// Get products that are currently out of season
export const getOutOfSeasonProducts = async (req, res) => {
    try {
        const { getCurrentMonth } = await import('../../utils/seasonUtils.js');
        const currentMonth = getCurrentMonth();

        const query = { isSeasonal: true };
        if (req.activeBrand) query.brand = req.activeBrand;

        const seasonalProducts = await Product.find(query)
            .populate('category', 'name icon')
            .select('name isSeasonal availableMonths isAvailable category price image');

        // Filter products that don't include current month
        const outOfSeason = seasonalProducts.filter(product =>
            !product.availableMonths.includes(currentMonth)
        );

        res.status(200).json({
            success: true,
            data: outOfSeason,
            count: outOfSeason.length,
            currentMonth
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching out of season products',
            error: error.message
        });
    }
};

// Update product seasonal settings
export const updateProductSeason = async (req, res) => {
    try {
        const { id } = req.params;
        const { isSeasonal, availableMonths } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (isSeasonal !== undefined) {
            product.isSeasonal = isSeasonal;
        }

        if (availableMonths !== undefined) {
            product.availableMonths = availableMonths || product.availableMonths;
        }

        await product.save();

        // Log Activity
        await activityLogService.log(req, {
            action: 'update',
            resource: 'product',
            resourceId: product._id,
            details: {
                type: 'seasonal_settings',
                name: product.name,
                isSeasonal: product.isSeasonal,
                availableMonths: product.availableMonths
            }
        });

        const updatedProduct = await Product.findById(id)
            .populate('category', 'name icon');

        // Invalidate customer cache
        clearProductCache();

        res.status(200).json({
            success: true,
            message: 'Product seasonal settings updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating product season',
            error: error.message
        });
    }
};
// Get product stats
export const getProductStats = async (req, res) => {
    try {
        const query = {};
        if (req.activeBrand) query.brand = req.activeBrand;

        const [
            totalProducts,
            hiddenProducts,
            newIntroProducts,
            categoriesCount
        ] = await Promise.all([
            Product.countDocuments(query),
            Product.countDocuments({ ...query, isAvailable: false }),
            Product.countDocuments({ ...query, tags: 'new-intro' }),
            Category.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                hiddenProducts,
                newIntroProducts,
                categoriesCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product stats',
            error: error.message
        });
    }
};
