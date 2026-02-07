import User from '../../models/User.js';
import Order from '../../models/Order.js';
import { SOCKET_EVENTS } from '../../sockets/socketEvents.js';
import { statsService } from '../../services/statsService.js';
import activityLogService from '../../services/activityLogService.js';

// Get all customers with filters and search
export const getAllCustomers = async (req, res) => {
    try {
        const { search, isActive } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order === 'asc' ? 1 : -1;
        const skip = (page - 1) * limit;

        // Build query for customers only
        let query = { role: 'customer' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const customers = await User.find(query)
            .select('-password -__v')
            .sort({ [sortBy]: order })
            .limit(limit)
            .skip(skip);

        const total = await User.countDocuments(query);

        // Get order counts for each customer
        const customersWithStats = await Promise.all(
            customers.map(async (customer) => {
                const orderCount = await Order.countDocuments({ customerId: customer._id });
                const totalSpent = await Order.aggregate([
                    { $match: { customerId: customer._id, status: 'delivered', paymentStatus: 'paid' } },
                    { $group: { _id: null, total: { $sum: '$total' } } }
                ]);

                return {
                    ...customer.toObject(),
                    orderCount,
                    totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
                };
            })
        );

        res.status(200).json({
            success: true,
            count: customersWithStats.length,
            data: customersWithStats,
            pagination: {
                current: page,
                totalPages: Math.ceil(total / limit),
                limit: limit,
                totalItems: total
            }
        });
    } catch (error) {
        console.error('GetAllCustomers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customers',
            error: error.message
        });
    }
};

// Get customer statistics
export const getCustomerStats = async (req, res) => {
    try {
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const activeCustomers = await User.countDocuments({ role: 'customer', isActive: true });
        const inactiveCustomers = await User.countDocuments({ role: 'customer', isActive: false });

        // Customers registered today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newCustomersToday = await User.countDocuments({
            role: 'customer',
            createdAt: { $gte: today }
        });

        // Customers with orders
        const customersWithOrders = await Order.distinct('customerId');

        res.status(200).json({
            success: true,
            data: {
                totalCustomers,
                activeCustomers,
                inactiveCustomers,
                newCustomersToday,
                customersWithOrders: customersWithOrders.length
            }
        });
    } catch (error) {
        console.error('GetCustomerStats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer statistics',
            error: error.message
        });
    }
};

// Get single customer by ID with detailed info
export const getCustomerById = async (req, res) => {
    try {
        const customer = await User.findOne({ _id: req.params.id, role: 'customer' })
            .select('-password -__v')
            .populate({
                path: 'wishlist',
                select: 'name price image isAvailable'
            });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Get order statistics
        const orderCount = await Order.countDocuments({ customerId: customer._id });
        const orders = await Order.find({ customerId: customer._id })
            .select('status total paymentStatus createdAt')
            .sort({ createdAt: -1 });

        const totalSpent = await Order.aggregate([
            { $match: { customerId: customer._id, status: 'delivered', paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const pendingOrders = await Order.countDocuments({
            customerId: customer._id,
            status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'] }
        });

        const completedOrders = await Order.countDocuments({
            customerId: customer._id,
            status: 'delivered'
        });

        const cancelledOrders = await Order.countDocuments({
            customerId: customer._id,
            status: 'cancelled'
        });

        res.status(200).json({
            success: true,
            data: {
                ...customer.toObject(),
                stats: {
                    orderCount,
                    totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
                    pendingOrders,
                    completedOrders,
                    cancelledOrders
                }
            }
        });
    } catch (error) {
        console.error('GetCustomerById Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer details',
            error: error.message
        });
    }
};

// Get customer order history
export const getCustomerOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const orders = await Order.find({ customerId: req.params.id })
            .populate('items.product', 'name price image')
            .populate('riderId', 'name mobile')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await Order.countDocuments({ customerId: req.params.id });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
            pagination: {
                current: page,
                totalPages: Math.ceil(total / limit),
                limit: limit,
                totalItems: total
            }
        });
    } catch (error) {
        console.error('GetCustomerOrders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer orders',
            error: error.message
        });
    }
};

// Toggle customer status (activate/deactivate)
export const toggleCustomerStatus = async (req, res) => {
    try {
        const customer = await User.findOne({ _id: req.params.id, role: 'customer' });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        customer.isActive = !customer.isActive;
        await customer.save();

        // Log Activity
        await activityLogService.log(req, {
            action: customer.isActive ? 'activate' : 'deactivate',
            resource: 'customer',
            resourceId: customer._id,
            details: { name: customer.name }
        });

        res.status(200).json({
            success: true,
            message: `Customer ${customer.isActive ? 'activated' : 'deactivated'} successfully`,
            data: customer
        });
    } catch (error) {
        console.error('ToggleCustomerStatus Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating customer status',
            error: error.message
        });
    }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
    try {
        const customer = await User.findOne({ _id: req.params.id, role: 'customer' });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check if customer has any orders
        const orderCount = await Order.countDocuments({ customerId: customer._id });

        if (orderCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer with ${orderCount} order(s). Deactivate instead.`
            });
        }

        await customer.deleteOne();

        // Update Stats Transactionally
        await statsService.decrement('totalCustomers');

        // Emit Socket.io event DIRECTLY (Bypassing service for reliability)
        const io = req.app.get('io');
        if (io) {
            console.log('EMITTED user:deleted via direct IO');
            io.emit(SOCKET_EVENTS.USER_DELETED, {
                id: customer._id,
                role: 'customer',
                totalCustomers: (await statsService.getStats()).totalCustomers
            });
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'delete',
            resource: 'customer',
            resourceId: customer._id,
            details: { name: customer.name }
        });

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('DeleteCustomer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting customer',
            error: error.message
        });
    }
};
