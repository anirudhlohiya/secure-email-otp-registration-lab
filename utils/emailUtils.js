const nodemailer = require('nodemailer');

// 1. Create a Nodemailer transporter object
const transporter = nodemailer.createTransport({
    // 🔑 Use the 'service' property set to 'gmail'
    service: 'gmail',
    
    // REMOVE all host/port/secure/tls settings
    // They are not needed when using service: 'gmail'
    
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


/**
 * Sends a verification email containing the OTP.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} otpCode - The generated OTP.
 * @returns {Promise<object>} The result of the email sending operation.
 */
async function sendVerificationEmail(toEmail, otpCode) {
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: toEmail, // List of recipients
        subject: 'Secure Registration: Email Verification OTP', // Subject line
        html: `
            <h2>Email Verification</h2>
            <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
            <h1 style="color: #3f51b5; background: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block;">${otpCode}</h1>
            <p>This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        ` // HTML body
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Verification Email sent:', info.response);
        return { success: true, message: 'OTP sent successfully.' };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, message: 'Failed to send OTP email.', error: error.message };
    }
}

module.exports = {
    sendVerificationEmail
};