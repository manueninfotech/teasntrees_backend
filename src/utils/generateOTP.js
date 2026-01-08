// OTP Generation Utilities

/**
 * Generate a random 6-digit OTP
 * 
 * @returns {String} 6-digit OTP
 */

const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
};

/**
 * Generate OTP with custom length
 * 
 * @param {number} length - Length of OTP
 * @returns {String} OTP
 */

const generateCustomOTP = (length = 6) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const otp = Math.floor(min + Math.random() * (max - min));
    return otp.toString();
};

export {
    generateOTP,
    generateCustomOTP
};