// Role based Access Control Middleware

/**
 * check if user has required role
 * @param {Array|String} allowedRoles
 * @returns {Function}
 */

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated (should be set by auth middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication Required'
            });
        }

        // Convert Single role to array
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        // check if user's role is i allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied.Insufficient Permissions',
                required: roles,
                current: req.user.role
            });
        }

        // user has required role, proceed
        next();
    };
};

// check if user is admin
const isAdmin = checkRole(['admin']);

// check is user is customer
const isCustomer = checkRole(['customer']);

// check if user is rider
const isRider = checkRole(['rider']);

// check if user is manager
const isManager = checkRole(['manager']);

export {
    checkRole,
    isAdmin,
    isCustomer,
    isRider,
    isManager
};