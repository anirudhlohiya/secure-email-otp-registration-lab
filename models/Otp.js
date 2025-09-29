const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true // Ensure only one active OTP per email
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // Automatically delete the document after a certain time (e.g., 5 min)
        // This leverages MongoDB's TTL (Time-To-Live) index, similar to expiry control [cite: 34]
        index: { expires: '10m' } // Expires in 10 minutes (adjust based on .env)
    }
});

module.exports = mongoose.model('Otp', OtpSchema);