/**
 * Generates a 6-digit numeric OTP.
 * @returns {string} The 6-digit OTP as a string.
 */
function generateOTP() {
    // Math.random() generates a number between 0 and 1.
    // Multiply by 900000 (1000000 - 100000) to get a number between 0 and 899999.
    // Add 100000 to ensure it is always 6 digits (between 100000 and 999999).
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}

module.exports = {
    generateOTP
};