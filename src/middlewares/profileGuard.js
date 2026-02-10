/**
 * Middleware to ensure user has completed their profile
 * Use this after 'authenticate' middleware
 */
export const checkProfileComplete = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (!req.user.isProfileComplete) {
        return res.status(403).json({
            success: false,
            message: 'Incomplete profile. Please complete your profile to access this feature.',
            isProfileComplete: false
        });
    }

    next();
};
