import { verifyToken } from '../utils/jwtHelper.js';
import User from '../models/User.js';

/**
 * Socket.io authentication middleware
 * Verifies JWT token and attaches user info to socket
 */
export const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = verifyToken(token);

        // Find user
        const user = await User.findById(decoded.userId);

        if (!user) {
            return next(new Error('User not found'));
        }

        if (!user.isActive) {
            return next(new Error('Account is deactivated'));
        }

        // Attach user info to socket
        socket.user = {
            userId: user._id.toString(),
            role: user.role,
            mobile: user.mobile,
            name: user.name,
            brand: socket.handshake.auth.brand || user.preferences?.activeBrand || 'teasntrees'
        };

        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
    }
};
