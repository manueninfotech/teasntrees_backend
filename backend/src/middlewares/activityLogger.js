import ActivityLog from '../models/ActivityLog.js';

/**
 * Activity logger middleware - logs all admin actions
 * @param {string} action - Action type (create, update, delete, etc.)
 * @param {string} resource - Resource type (user, product, category, etc.)
 * @returns {Function} Express middleware function
 */
export const logActivity = (action, resource) => {
    return async (req, res, next) => {
        // Store original methods
        const originalJson = res.json.bind(res);
        const originalStatus = res.status.bind(res);

        let statusCode = 200;

        // Override status to capture it
        res.status = function (code) {
            statusCode = code;
            return originalStatus(code);
        };

        // Override json to log after response
        res.json = async function (data) {
            try {
                // Only log if user is authenticated
                if (req.user && req.user.userId) {
                    await ActivityLog.create({
                        admin: req.user.userId,
                        action,
                        resource,
                        resourceId: req.params.id || data.data?._id,
                        details: {
                            method: req.method,
                            path: req.path,
                            body: sanitizeBody(req.body),
                            response: data.success ? 'Success' : 'Failed'
                        },
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.headers['user-agent'],
                        success: data.success !== false && statusCode < 400,
                        errorMessage: !data.success ? data.message : null
                    });
                }
            } catch (error) {
                console.error('Activity logging error:', error);
                // Don't fail the request if logging fails
            }

            return originalJson(data);
        };

        next();
    };
};

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body) {
    if (!body) return {};

    const sanitized = { ...body };

    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.otp;
    delete sanitized.token;

    return sanitized;
}
