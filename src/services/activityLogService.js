import ActivityLog from '../models/ActivityLog.js';
import logger from '../config/logger.js';

class ActivityLogService {
    async log(req, data) {
        try {
            // Get admin ID from request user or from explicit data if provided (useful for login events)
            const adminId = req.user?._id || req.user?.id || req.user?.userId || data.adminId;

            if (!adminId) {
                // For login events, we might not have a session yet, but we should have the user ID in the log request
                return;
            }

            const logEntry = new ActivityLog({
                admin: adminId,
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
                // Broadcast to admin role specifically
                socketService.notifyRole('admin', 'activity-log:new', logObject);
                // Also broadcast globally
                socketService.broadcast('activity-log:new', logObject);
            }
            // Fallback to raw IO if service not available
            else {
                const io = req.app.get('io');
                if (io) {
                    io.emit('activity-log:new', logObject);
                    io.to('role:admin').emit('activity-log:new', logObject);
                }
            }

            return logEntry;
        } catch (error) {
            logger.error('[ActivityLog] Error creating log:', error);
        }
    }
}

export default new ActivityLogService();
