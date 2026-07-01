// JWT Helper Functions

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import jwtConfig from '../config/jwt.js';

// Generate a JWT access token (short-lived)
const generateToken = (payload, expiresIn = '1h') => {  
    return jwt.sign(payload, jwtConfig.secret, {
        expiresIn
    });
};

// Generate a cryptographically secure refresh token
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

// Verify and decode a JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Verify refresh token format (actual validation against DB happens in controller)
const verifyRefreshTokenFormat = (token) => {
    return token && typeof token === 'string' && token.length === 128;
};

// Decode a JWT token without verification
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