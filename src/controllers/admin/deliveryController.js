import Delivery from '../../models/Delivery.js';
import Order from '../../models/Order.js';

// Get all deliveries with filters
export const getAllDeliveries = async (req, res) => {
    try {
        const { status, riderId, startDate, endDate } = req.query;
        // Build query
        let query = {};
        if (status) {
            query.status = status;
        }
        if (riderId) {
            query.riderId = riderId;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        const deliveries = await Delivery.find(query)
            .populate('order', 'orderNumber totalAmount')
            .populate('rider', 'name mobile')
            .populate('customer', 'name mobile address')
            .sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            count: deliveries.length,
            data: deliveries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching deliveries',
            error: error.message
        });
    }
};

// Get single delivery by ID
export const getDeliveryById = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('order', 'orderNumber totalAmount items')
            .populate('rider', 'name mobile email')
            .populate('customer', 'name mobile address')
            .sort({ createdAt: -1 });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        res.status(200).json({
            success: true,
            data: delivery
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery',
            error: error.message
        });
    }
};

// update delivery status
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['assigned', 'picked-up', 'in-transit', 'delivered', 'failed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }
        delivery.status = status;
        // update timestamps based on status
        if (status === 'picked-up') {
            delivery.pickedUpAt = new Date();
        } else if (status === 'delivered') {
            delivery.deliveredAt = new Date();
            delivery.completedAt = new Date();
        }
        await delivery.save();
        // update order status if delivery is completed
        if (status === 'delivered') {
            await Order.findByIdAndUpdate(delivery.order, { status: 'delivered', deliveredAt: new Date() });
        }
        res.status(200).json({
            success: true,
            message: 'Delivery status updated successfully',
            data: delivery
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating delivery status',
            error: error.message
        });
    }
};

// update delivery location
export const updateDeliveryLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        delivery.currentLocation = {
            type: 'Point',
            coordinates: [longitude, latitude]
        };

        await delivery.save();

        res.status(200).json({
            success: true,
            message: 'Delivery location updated successfully',
            data: delivery
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating delivery location',
            error: error.message
        });
    }
};

// complete delivery 
export const completeDelivery = async (req, res) => {
    try {
        const { deliveryProof, customerSignature } = req.body;

        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        if (delivery.status === 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Delivery already completed'
            });
        }

        delivery.status = 'delivered';
        delivery.deliveredAt = new Date();
        delivery.completedAt = new Date();

        if (deliveryProof) {
            delivery.deliveryProof = deliveryProof;
        }

        if (customerSignature) {
            delivery.customerSignature = customerSignature;
        }

        await delivery.save();

        // Update order status
        await Order.findByIdAndUpdate(delivery.order, {
            status: 'delivered',
            deliveredAt: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Delivery completed successfully',
            data: delivery
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error completing delivery',
            error: error.message
        });
    }
};

// Get delivery Statistics
export const getDeliveryStats = async (req, res) => {
    try {
        const totalDeliveries = await Delivery.countDocuments();
        const activeDeliveries = await Delivery.countDocuments({
            status: { $in: ['assigned', 'picked-up', 'in-transit'] }
        });
        const completedDeliveries = await Delivery.countDocuments({ status: 'delivered' });
        const failedDeliveries = await Delivery.countDocuments({ status: 'failed' });

        // Calculate total earnings
        const earningsData = await Delivery.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, totalEarnings: { $sum: '$riderEarnings' } } }
        ]);

        const totalEarnings = earningsData.length > 0 ? earningsData[0].totalEarnings : 0;

        res.status(200).json({
            success: true,
            data: {
                totalDeliveries,
                activeDeliveries,
                completedDeliveries,
                failedDeliveries,
                totalEarnings
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery stats',
            error: error.message
        });
    }
};