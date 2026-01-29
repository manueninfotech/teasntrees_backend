import User from '../../models/User.js';
import Order from '../../models/Order.js';

// Get all Customers (Read-only)
export const getCustomers = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        let query = { role: 'customer' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const customers = await User.find(query)
            .select('-password -__v -fcmToken')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                customers,
                pagination: {
                    current: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching customers' });
    }
};

// Get Customer Orders
export const getCustomerOrders = async (req, res) => {
    try {
        const { id } = req.params;
        const orders = await Order.find({ customerId: id })
            .populate('rider', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching customer orders' });
    }
};
