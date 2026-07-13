import Rider from '../../models/Rider.js';
import activityLogService from '../../services/activityLogService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';

export const getRiders = async (req, res) => {
    try {
        const { type, page = 1, limit = 1000 } = req.query; // type: 'pending', 'assigned', 'all'

        const query = {
            $or: [
                { isApproved: false }, // Pending applications
                { managerId: req.user.userId }, // Already assigned to this manager
                { managerId: null, isApproved: true } // Approved by Admin but unassigned
            ]
        };

        if (type === 'pending') {
            query.isApproved = false;
        } else if (type === 'assigned') {
            query.isApproved = true;
            query.managerId = req.user.userId;
        } else if (type === 'available') {
            query.isApproved = true;
            query.isActive = true;
            query.managerId = req.user.userId;
        }

        const riders = await Rider.find(query)
            .select('-password -__v')
            .sort({ createdAt: -1 });

        const ridersWithStatus = await Promise.all(riders.map(async (r) => {
            // Self-healing: Ensure isOnDelivery is accurate
            const { riderAssignmentService } = await import('../../services/riderAssignmentService.js');
            const isOnDelivery = await riderAssignmentService.syncRiderStatus(r._id);
            return { ...r.toObject(), isBusy: isOnDelivery, isOnDelivery: isOnDelivery };
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
    try {
        const { id } = req.params;
        const rider = await Rider.findById(id);

        if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
        if (rider.isApproved) return res.status(400).json({ success: false, message: 'Cannot reject an already approved rider' });

        await Rider.findByIdAndDelete(id);

        await activityLogService.log(req, {
            action: 'reject',
            resource: 'rider',
            resourceId: id,
            details: { name: rider.name, rejectedBy: req.user.name }
        });

        res.status(200).json({ success: true, message: 'Rider application rejected' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error rejecting rider' });
    }
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

        // Log Activity
        await activityLogService.log(req, {
            action: 'deactivate',
            resource: 'user',
            resourceId: rider._id,
            details: { name: rider.name, role: 'rider', reason }
        });

        // Emit Socket Event
        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.user(rider._id)).emit(SOCKET_EVENTS.USER_DEACTIVATED, {
                message: `Your account has been suspended. Reason: ${reason || 'No reason provided'}`
            });
        }

        res.status(200).json({ success: true, message: 'Rider suspended' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error suspending rider' });
    }
};
