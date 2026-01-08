// JWT Helper Functions

import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';

/**
 * Generate a JWT token
 * @param {Object} payload - Data to encode
 * @param {String} expiresIn -Expiration time
 * @returns {String} -Encoded token
 */

const generateToken = (payload, expiresIn = jwtConfig.expire) => {
    return jwt.sign(payload, jwtConfig.secret, {
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
        return jwt.verify(token, jwtConfig.secret);
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

export {
    generateToken,
    verifyToken,
    decodeToken
};