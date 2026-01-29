
import ActivityLog from '../models/ActivityLog.js';
import { SOCKET_EVENTS } from '../sockets/socketEvents.js';

class ActivityLogService {
    async log(req, data) {
        try {
            console.log('[ActivityLog DEBUG] Attempting to log:', data);
            console.log('[ActivityLog DEBUG] User in request:', req.user);

            // Ensure admin ID exists
            const adminId = req.user?._id || req.user?.id || req.user?.userId; // Added userId check
            if (!adminId) {
                console.warn('[ActivityLog] No admin ID found in request, skipping log. Headers:', req.headers);
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
            console.log('[ActivityLog DEBUG] Log saved successfully:', logEntry._id);

            // Convert to plain object
            const logObject = logEntry.toObject();

            // Try to use the centralized SocketService first
            const socketService = req.app.get('socketService');

            if (socketService) {
                // Broadcast to admin role specifically
                socketService.notifyRole('admin', 'activity-log:new', logObject);
                // Also broadcast globally just in case
                socketService.broadcast('activity-log:new', logObject);

                console.log('[ActivityLog DEBUG] Emitted via SocketService');
            }
            // Fallback to raw IO if service not available
            else {
                const io = req.app.get('io');
                if (io) {
                    io.emit('activity-log:new', logObject); // Global
                    io.to('role:admin').emit('activity-log:new', logObject); // Explicit room
                    console.log('[ActivityLog DEBUG] Emitted via raw IO');
                } else {
                    console.warn('[ActivityLog DEBUG] No socket instance found');
                }
            }

            return logEntry;
        } catch (error) {
            console.error('[ActivityLog] Error creating log:', error);
            // Don't throw error to prevent disrupting the main flow
        }
    }
}

export default new ActivityLogService();
