// Authentication Middleware

import { verifyToken } from '../utils/jwtHelper.js';
import User from '../models/User.js';

// Authenticate User by verifying jwt token 
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }
        //Extract token and remove "Bearer " prefix
        const token = authHeader.substring(7);

        // verify token
        const decode = verifyToken(token);

        // Find user from decoded token
        const user = await User.findById(decode.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated.'
            });
        }

        //Attach user to request object
        req.user = {
            userId: user._id,
            mobile: user.mobile,
            email: user.email,
            role: user.role,
            isProfileComplete: user.isProfileComplete,
            activeBrand: user.preferences?.activeBrand,
            brand: user.brand
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || 'Invalid or expired token.'
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 * 
 * Useful for routes that work differently for authenticated users
 * but don't require authentication
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without user
            req.user = null;
            return next();
        }
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
            req.user = {
                userId: user._id,
                mobile: user.mobile,
                email: user.email,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                activeBrand: user.preferences?.activeBrand,
                brand: user.brand
            };
        } else {
            req.user = null;
        }
        next();
    } catch (error) {
        // Token invalid, continue without user
        req.user = null;
        next();
    }
};
export {
    authenticateUser as authenticate,
    optionalAuthenticate
};