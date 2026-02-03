// Manager Product Controller
import Product from '../../models/Product.js';
import activityLogService from '../../services/activityLogService.js';

// Get Products
export const getProducts = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;
        let query = {};

        if (category) query.category = category;
        if (search) query.name = { $regex: search, $options: 'i' };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(query)
            .populate('category', 'name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ name: 1 });

        const total = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                current: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
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

// Toggle Availability (In Stock / Out of Stock)
export const toggleProductAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body; // Expect boolean

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const oldValue = product.isAvailable;
        product.isAvailable = isAvailable;
        await product.save();

        // Log Activity
        await activityLogService.log(req, {
            action: 'update_availability',
            resource: 'product',
            resourceId: product._id,
            details: {
                name: product.name,
                previous: oldValue,
                current: isAvailable
            }
        });

        res.status(200).json({
            success: true,
            message: `Product marked as ${isAvailable ? 'Available' : 'Unavailable'}`,
            data: product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating product availability',
            error: error.message
        });
    }
};

// Update Product
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const product = await Product.findByIdAndUpdate(id, updates, { new: true });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await activityLogService.log(req, {
            action: 'update',
            resource: 'product',
            resourceId: product._id,
            details: { name: product.name, updates }
        });

        res.status(200).json({ success: true, message: 'Product updated', data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating product', error: error.message });
    }
};
