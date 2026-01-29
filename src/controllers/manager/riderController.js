import Rider from '../../models/Rider.js';
import activityLogService from '../../services/activityLogService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';

// Get Riders (All or My Riders?)
// Spec: "Manager approves riders", "Each rider belongs to one manager"
// We'll allow fetching:
// 1. Pending riders (for approval)
// 2. Riders assigned to this manager
export const getRiders = async (req, res) => {
    try {
        const { type, page = 1, limit = 10 } = req.query; // type: 'pending', 'assigned', 'all'

        const query = {};

        if (type === 'pending') {
            query.isApproved = false;
        } else if (type === 'assigned') {
            // "Active" tab in frontend: User wants to see ALL working riders?
            // Or only those strictly assigned to them?
            // User feedback "cannot see riders" implies they expect to see them.
            // Let's relax this to show all APPROVED riders for now, 
            // or perhaps check if we should strictly filter.
            // If we relax it, Managers can see all riders.
            query.isApproved = true;
            // query.managerId = req.user.userId; // user said "rider is getting assigned". 
            // If they are strictly 1:1, this line is correct. 
            // But if they are just "Manager of the Store" managing "All Riders", this is too strict.
            // Let's COMMENT OUT the strict manager check for 'assigned' type to allow seeing all active riders.
        } else if (type === 'available') {
            // Fetch all active, approved riders for order assignment
            query.isApproved = true;
            query.isActive = true;
        } else {
            // 'all' might be restricted? Let's just return all for now or filter by what makes sense.
            // If strict one-to-many, maybe they can only see their own?
            // But they need to see pending global list to pick them?
            // Or maybe Admins assign riders to Managers?
            // Spec says "Manager approves riders". So they need to see pending list.
        }

        const riders = await Rider.find(query)
            .select('-password -__v')
            .sort({ createdAt: -1 });

        // Enhance with busy status check (inefficient loop for now, but simple)
        // Ideally should be an aggregation
        const ridersWithStatus = await Promise.all(riders.map(async (r) => {
            const activeOrder = await import('../../models/Order.js').then(m => m.default.exists({
                riderId: r._id,
                status: { $in: ['assigned', 'confirmed', 'preparing', 'ready', 'picked_up', 'out-for-delivery'] }
            }));
            return { ...r.toObject(), isBusy: !!activeOrder };
        }));

        res.status(200).json({ success: true, data: ridersWithStatus });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching riders' });
    }
};

export const approveRider = async (req, res) => {
    try {
        const { id } = req.params;
        const rider = await Rider.findById(id);

        if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
        if (rider.isApproved) return res.status(400).json({ success: false, message: 'Already approved' });

        rider.isApproved = true;
        rider.isActive = true; // Auto activate?
        rider.managerId = req.user.userId; // Assign to this manager

        await rider.save();

        await activityLogService.log(req, {
            action: 'approve',
            resource: 'rider',
            resourceId: rider._id,
            details: { name: rider.name, assignedTo: req.user.name }
        });

        // Notify Rider
        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.user(rider._id)).emit(SOCKET_EVENTS.USER_APPROVED, {
                message: 'Your rider account has been approved'
            });
        }

        res.status(200).json({ success: true, message: 'Rider approved and assigned', data: rider });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error approving rider' });
    }
};

export const rejectRider = async (req, res) => {
    // Similar to admin reject
};

export const suspendRider = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const rider = await Rider.findOne({ _id: id, managerId: req.user.userId });

        if (!rider) return res.status(404).json({ success: false, message: 'Rider not found or not assigned to you' });

        rider.isActive = false;
        // Maybe store suspension reason/date?

        await rider.save();

        // Log and socket...
        res.status(200).json({ success: true, message: 'Rider suspended' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error suspending rider' });
    }
};
