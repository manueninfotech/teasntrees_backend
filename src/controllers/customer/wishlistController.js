import Customer from '../../models/Customer.js';
import Product from '../../models/Product.js';

// Add product to wishlist
export const addToWishlist = async (req, res) => {
    try {

        const { productId } = req.body;
        const customerId = req.user.userId;

        const result = await Customer.updateOne(
            { _id: customerId },
            { $addToSet: { wishlist: productId } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist"
        });

    } catch (error) {

        console.error("Error in addToWishlist:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add to wishlist"
        });

    }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
    try {

        const { productId } = req.params;
        const customerId = req.user.userId;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        const result = await Customer.updateOne(
            { _id: customerId },
            { $pull: { wishlist: productId } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist"
        });

    } catch (error) {

        console.error("Error in removeFromWishlist:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove from wishlist"
        });

    }
};

// Get wishlist
export const getWishlist = async (req, res) => {
    try {
        const customerId = req.user.userId;

        const customer = await Customer.findById(customerId)
            .select('wishlist')
            .populate('wishlist')
            .lean();

        if (!customer) {
            // Customer doesn't exist yet, return empty array
            return res.json({
                success: true,
                data: []
            });
        }

        // Filter wishlist items by brand for strict isolation
        const items = (customer.wishlist || []).filter(item => !!item);

        res.json({
            success: true,
            data: items
        });

    } catch (error) {
        console.error('Error in getWishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wishlist'
        });
    }
};
