import Customer from '../../models/Customer.js';
import Product from '../../models/Product.js';

// Add product to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const customerId = req.user.userId;

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Add to wishlist (addToSet avoids duplicates)
        const customer = await Customer.findByIdAndUpdate(
            customerId,
            { $addToSet: { wishlist: productId } },
            { new: true }
        ).populate('wishlist');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            message: 'Product added to wishlist',
            data: customer.wishlist
        });

    } catch (error) {
        console.error('Error in addToWishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add to wishlist'
        });
    }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const customerId = req.user.userId;

        const customer = await Customer.findByIdAndUpdate(
            customerId,
            { $pull: { wishlist: productId } },
            { new: true }
        ).populate('wishlist');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            message: 'Product removed from wishlist',
            data: customer.wishlist
        });

    } catch (error) {
        console.error('Error in removeFromWishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove from wishlist'
        });
    }
};

// Get wishlist
export const getWishlist = async (req, res) => {
    try {
        const customerId = req.user.userId;

        const customer = await Customer.findById(customerId)
            .populate('wishlist')
            .select('wishlist');

        if (!customer) {
            // Customer doesn't exist yet, return empty array
            return res.json({
                success: true,
                data: []
            });
        }

        res.json({
            success: true,
            data: customer.wishlist || []
        });

    } catch (error) {
        console.error('Error in getWishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wishlist'
        });
    }
};
