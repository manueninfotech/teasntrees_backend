import logger from '../config/logger.js';

// IP Whitelist for admin routes

const whitelist = process.env.ADMIN_WHITELIST_IPS?.split(',').map(ip => ip.trim()) || [];

export const checkAdminIP = (req, res, next) => {
    // Skip in development mode
    if (process.env.NODE_ENV === 'development') {
        return next();
    }

    // Skip if no whitelist configured
    if (whitelist.length === 0) {
        logger.warn('Admin IP whitelist not configured - allowing all IPs');
        return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;

    if (!whitelist.includes(clientIP)) {
        logger.warn('Admin access attempt from non-whitelisted IP', {
            ip: clientIP,
            path: req.path
        });
        return res.status(403).json({
            success: false,
            message: 'Access denied from this IP address'
        });
    }

    logger.info('Admin access from whitelisted IP', { ip: clientIP });
    next();
};
