import Product from "../../models/Product.js";
import Category from "../../models/Category.js";

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const { category, search, isAvailable, tags } = req.query;
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

        const products = await Product.find(query).populate('category', 'name icon').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
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
        const product = await Product.create({
            name,
            description,
            category,
            price: price || 0,
            image,
            isAvailable,
            preparationTime,
            ingredients,
            allergens,
            tags,
            sizeOptions,
            variants,
            createdBy: req.user.id
        });
        const populatedProduct = await Product.findById(product._id).populate('category', 'name icon');
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
        // update fields
        Object.keys(req.body).forEach(key => {
            product[key] = req.body[key];
        });
        await product.save();
        const updatedProduct = await Product.findById(product._id).populate('category', 'name icon');
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
        await product.deleteOne();
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error bulk updating products',
            error: error.message
        });
    }
}
