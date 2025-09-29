const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOTP } = require('../utils/otpUtils');
const { sendVerificationEmail } = require('../utils/emailUtils');

// --- POST /register ---
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // 1. Basic Input Validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields (username, email, password) are required.' });
    }

    try {
        // 2. Existing User Check (Case-insensitive)
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            // Check if user is already verified
            if (existingUser.isVerified) {
                return res.status(409).json({ message: 'User already exists and is verified. Please log in.' });
            }
            // If user exists but is NOT verified, we proceed to resend a new OTP.
            // This prevents a new registration attempt and directs them to verification.
            // We'll treat this as a success and update their OTP.
        }

        let user;
        if (!existingUser || !existingUser.isVerified) {
            // 3. Password Hashing (Cost factor 10 is standard)
            const hashedPassword = await bcrypt.hash(password, 10);
            
            if (existingUser) {
                // User exists but is unverified: update their password and registration details
                user = existingUser;
                user.username = username;
                user.password = hashedPassword;
                await user.save();
            } else {
                // New User: Save with isVerified: false 
                user = new User({
                    username,
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    isVerified: false
                });
                await user.save();
            }
        }
        
        // 4. Generate and Save OTP 
        const otpCode = generateOTP();
        
        // Ensure only one active OTP per email by using update/upsert
        await Otp.findOneAndUpdate(
            { email: email.toLowerCase() },
            { otp: otpCode, createdAt: Date.now() },
            { upsert: true, new: true, runValidators: true }
        );

        // 5. Send Verification Email 
        const emailResult = await sendVerificationEmail(email, otpCode);

        if (!emailResult.success) {
            // Log the error but still return a soft success to the user for security reasons (don't leak server errors)
            console.error(`Failed to send email to ${email}: ${emailResult.error}`);
            // Note: In a production app, you might want to delete the user/OTP here or flag them for manual review.
        }

        return res.status(201).json({ 
            message: 'Registration successful! Verification OTP sent to your email.', 
            email: email,
            // For testing: DO NOT include in a real app!
            otp: otpCode 
        });

    } catch (error) {
        console.error('Registration error:', error);
        // Handle MongoDB unique key error (e.g., if username is already taken)
        if (error.code === 11000) {
             // 11000 is the code for duplicate key error in MongoDB
             return res.status(409).json({ message: 'Username or email already in use.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

router.post('/verify-email', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required for verification.' });
    }

    try {
        // 1. Find the OTP record
        const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp });

        // 2. Check if OTP is valid (exists and not expired by TTL index)
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // 3. Find and Update the User
        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { isVerified: true },
            { new: true } // Returns the updated document
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 4. Delete the used OTP for single-use security
        await Otp.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({ 
            message: 'Email successfully verified. You can now log in.',
            isVerified: user.isVerified
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification.' });
    }
});

// ------------------------------------------------------------------
// 🔑 ADD THIS MISSING ROUTE: POST /login
// ------------------------------------------------------------------
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // 1. Find the User by Email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 2. Compare Password (using bcrypt)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 3. Check for Email Verification Status
        if (!user.isVerified) {
            return res.status(403).json({ 
                message: 'Account not verified. Please check your email for the verification OTP.',
                requiresVerification: true 
            });
        }

        // 4. Success 
        return res.status(200).json({
            message: `Login successful. Welcome, ${user.username}!`,
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


module.exports = router;