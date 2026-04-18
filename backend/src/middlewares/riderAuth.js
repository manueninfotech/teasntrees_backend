import jwt from 'jsonwebtoken';
import Rider from '../models/Rider.js';

export const riderAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the token is for a rider role
        if (decoded.role !== 'rider') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized as a rider'
            });
        }

        // Find the rider
        const rider = await Rider.findById(decoded.userId);

        if (!rider) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized as a rider'
            });
        }

        if (!rider.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Attach rider to request object
        req.user = {
            userId: rider._id,
            role: rider.role,
            isApproved: rider.isApproved
        };
        req.rider = rider; // Full rider object for easy access

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

// Middleware to check if rider is approved
export const isApprovedRider = (req, res, next) => {
    if (!req.user.isApproved) {
        return res.status(403).json({
            success: false,
            message: 'Your account is pending approval. You cannot perform this action yet.'
        });
    }
    next();
};
