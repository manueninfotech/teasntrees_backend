import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from "../../utils/imageUpload.js";
import { SOCKET_EVENTS } from "../../sockets/socketEvents.js";
import { statsService } from "../../services/statsService.js";
import activityLogService from '../../services/activityLogService.js';

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const { category, search, isAvailable, tags } = req.query;
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

        // verify category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Handle image upload
        let productImage = image; // Default to string URL from body
        if (req.file) {
            // If file uploaded, upload to Cloudinary
            const uploadResult = await uploadToCloudinary(req.file.buffer, 'products');
            productImage = uploadResult.url;
        }

        const product = await Product.create({
            name,
            description,
            category,
            price: price || 0,
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
            io.emit(SOCKET_EVENTS.PRODUCT_CREATED, socketData);
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'create',
            resource: 'product',
            resourceId: product._id,
            details: { name: product.name, price: product.price }
        });

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
        // If category is being updated, verify it exists
        if (req.body.category && req.body.category !== product.category.toString()) {
            const categoryExists = await Category.findById(req.body.category);
            if (!categoryExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }
        }

        // Handle image upload/update
        if (req.file) {
            // Upload new image first (Blocking - required)
            const uploadResult = await uploadToCloudinary(req.file.buffer, 'products');

            // Delete old image from Cloudinary in background
            if (product.image && product.image.includes('cloudinary.com')) {
                const oldPublicId = extractPublicId(product.image);
                if (oldPublicId) {
                    deleteFromCloudinary(oldPublicId).catch(err =>
                        console.error('Error deleting old image (background):', err)
                    );
                }
            }

            product.image = uploadResult.url;
        } else if (req.body.image) {
            // If image URL is provided in body (already uploaded to Cloudinary via frontend)
            product.image = req.body.image;
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
            io.emit(SOCKET_EVENTS.PRODUCT_UPDATED, socketData);
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'update',
            resource: 'product',
            resourceId: product._id,
            details: { name: product.name }
        });

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
        if (product.image && product.image.includes('cloudinary.com')) {
            const publicId = extractPublicId(product.image);
            if (publicId) {
                deleteFromCloudinary(publicId).catch(err =>
                    console.error('Error deleting image from Cloudinary (background):', err)
                );
            }
        }

        // Update Stats
        await statsService.decrement('totalProducts');

        // Emit Socket.io event DIRECTLY
        const io = req.app.get('io');
        if (io) {
            io.emit(SOCKET_EVENTS.PRODUCT_DELETED, {
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
            io.emit(SOCKET_EVENTS.PRODUCT_UPDATED, { bulk: true, productIds });
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
        const products = await Product.find({ isSeasonal: true })
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

        const seasonalProducts = await Product.find({ isSeasonal: true })
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
            product.availableMonths = availableMonths;
        }

        await product.save();

        const updatedProduct = await Product.findById(id)
            .populate('category', 'name icon');

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
        const [
            totalProducts,
            hiddenProducts,
            newIntroProducts,
            categoriesCount
        ] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ isAvailable: false }),
            Product.countDocuments({ tags: 'new-intro' }),
            Category.countDocuments()
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
