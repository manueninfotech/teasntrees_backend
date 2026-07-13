// Input Validation Utilities

/**
 * Validate Mobile Number
 * @param {string} mobile - Mobile number to validate
 * @returns {boolean} - True if valid, false otherwise
 */

const isValidMobile = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
};

/**
 * validate email
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * valiadte user role
 * @param {string} role - Role to validate
 * @returns {boolean} - True if valid, false otherwise
 */

const isValidRole = (role) => {
    const validRoles = ['admin', 'customer', 'rider', 'manager'];
    return validRoles.includes(role);
};

/**
 * validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} - True if valid, false otherwise
 */

const isValidOTP = (otp) => {
    const otpRegex = /^[0-9]{6}$/;
    return otpRegex.test(otp);
};

/**
 * sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */

const sanitizeString = (input) => {
    if (typeof input != 'string') return '';
    return input.trim();
};

export {
    isValidMobile,
    isValidEmail,
    isValidRole,
    isValidOTP,
    sanitizeString
};