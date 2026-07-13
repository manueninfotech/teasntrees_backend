import User from '../../models/User.js';
import Order from '../../models/Order.js';

// Get all Customers (Read-only)
export const getCustomers = async (req, res) => {
    try {
        const { search, page = 1, limit = 1000 } = req.query;
        const brand = req.activeBrand || req.params.brand || 'littleh';
        let query = { role: 'customer' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const customers = await User.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'orders',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$customerId', '$$userId'] },
                                        { $eq: ['$brand', brand] }
                                    ]
                                }
                            }
                        },
                        { $project: { _id: 1 } }
                    ],
                    as: 'brandOrders'
                }
            },
            {
                $addFields: {
                    totalOrders: { $size: '$brandOrders' }
                }
            },
            {
                $project: {
                    password: 0,
                    __v: 0,
                    fcmToken: 0,
                    brandOrders: 0
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

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
            .populate('riderId', 'name') // Fixed field name
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching customer orders' });
    }
};
