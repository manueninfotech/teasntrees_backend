import ActivityLog from '../models/ActivityLog.js';
import logger from '../config/logger.js';

class ActivityLogService {
    async log(req, data) {
        try {
            // ONLY log actions performed by managers
            if (req.user?.role !== 'manager') {
                return;
            }

            // Get admin ID from request user or from explicit data if provided (useful for login events)
            const adminId = req.user?._id || req.user?.id || req.user?.userId || data.adminId;

            if (!adminId) {
                // For login events, we might not have a session yet, but we should have the user ID in the log request
                return;
            }

            const logEntry = new ActivityLog({
                admin: adminId,
                brand: req.activeBrand || data.brand,
                action: data.action,
                resource: data.resource,
                resourceId: data.resourceId,
                details: data.details || {},
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                success: data.success !== false, // Default to true
                errorMessage: data.errorMessage
            });

            await logEntry.save();

            // Convert to plain object
            const logObject = logEntry.toObject();

            // Try to use the centralized SocketService first
            const socketService = req.app.get('socketService');

            if (socketService) {
                // Broadcast to admin role in specific brand if available
                if (logObject.brand) {
                    socketService.notifyBrandRole(logObject.brand, 'admin', 'activity-log:new', logObject);
                } else {
                    // Fallback to global admin role if brand missing
                    socketService.notifyRole('admin', 'activity-log:new', logObject);
                }
            }
            // Fallback to raw IO if service not available
            else {
                const io = req.app.get('io');
                if (io) {
                    if (logObject.brand) {
                        io.to(SOCKET_ROOMS.brandRole(logObject.brand, 'admin')).emit('activity-log:new', logObject);
                    } else {
                        io.to(SOCKET_ROOMS.role('admin')).emit('activity-log:new', logObject);
                    }
                }
            }

            return logEntry;
        } catch (error) {
            logger.error('[ActivityLog] Error creating log:', error);
        }
    }
}

export default new ActivityLogService();
