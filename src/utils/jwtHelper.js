// JWT Helper Functions

const jwt = require('jsonwebtoken');
/**
 * Generate a JWT token
 * @param {Object} payload - Data to encode
 * @param {String} expiresIn -Expiration time
 * @returns {String} -Encoded token
 */

const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE || '30d') => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn
    });
};

/**
 * verify and decode a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} -Decoded token
 * @throws {Error} - If token is invalid or expired
 */

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

/**
 * Decode a JWT token
 * @param {String} token - JWT token to decode
 * @returns {Object} -Decoded token
 */

const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken
};