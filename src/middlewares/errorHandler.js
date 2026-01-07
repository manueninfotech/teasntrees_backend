// Global Error Handler Middleware

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Global Error Handler
 * Must be the last middleware in the chain
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    // Determine status code
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        // Suppress socket.io errors (browser dev tools noise)
        if (!req.originalUrl.includes('/socket.io/')) {
            console.error('Error:', {
                message: err.message,
                stack: err.stack,
                url: req.originalUrl,
                method: req.method,
                body: req.body,
                params: req.params,
                query: req.query
            });
        }
    }

    // Build error response
    const response = {
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err
        })
    };

    // Handle specific error types

    // MongoDB duplicate key error
    if (err.code === 11000) {
        response.message = 'Duplicate field value entered';
        response.field = Object.keys(err.keyPattern)[0];
        return res.status(400).json(response);
    }

    // MongoDB validation error
    if (err.name === 'ValidationError') {
        response.message = 'Validation Error';
        response.errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        return res.status(400).json(response);
    }

    // MongoDB cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        response.message = `Invalid ${err.path}: ${err.value}`;
        return res.status(400).json(response);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        response.message = 'Invalid token';
        return res.status(401).json(response);
    }

    if (err.name === 'TokenExpiredError') {
        response.message = 'Token expired';
        return res.status(401).json(response);
    }

    // Default error response
    res.status(statusCode).json(response);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function that catches errors
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    notFound,
    errorHandler,
    asyncHandler
};