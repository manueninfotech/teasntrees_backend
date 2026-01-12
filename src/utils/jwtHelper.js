// JWT Helper Functions

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import jwtConfig from '../config/jwt.js';

/**
 * Generate a JWT access token (short-lived)
 * @param {Object} payload - Data to encode
 * @param {String} expiresIn - Expiration time
 * @returns {String} - Encoded token
 */
const generateToken = (payload, expiresIn = '15m') => {  // Changed default to 15 minutes
    return jwt.sign(payload, jwtConfig.secret, {
        expiresIn
    });
};

/**
 * Generate a cryptographically secure refresh token
 * @returns {String} - Random hex string (128 chars)
 */
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

/**
 * Verify and decode a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} - Decoded token
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
 * Verify refresh token format (actual validation against DB happens in controller)
 * @param {String} token - Refresh token to verify
 * @returns {Boolean} - True if format is valid
 */
const verifyRefreshTokenFormat = (token) => {
    return token && typeof token === 'string' && token.length === 128;
};

/**
 * Decode a JWT token without verification
 * @param {String} token - JWT token to decode
 * @returns {Object} - Decoded token
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

export {
    generateToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshTokenFormat,
    decodeToken
};