/**
 * User Model
 * 
 * Features:
 * - Manages user authentication and profile data.
 * - Supports both traditional email/password and Google OAuth workflows.
 * - Handles OTP (One Time Password) verification fields for sign-ups.
 * - Manages password reset tokens and their expiration for account recovery.
 * - Stores user profile information like full name, username, and email.
 * - Includes a pre-save middleware to securely hash passwords using bcrypt
 *   before they are persisted to the database.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        unique: true,
        sparse: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: String,
    otpExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    try {
        console.log('Hashing password for user:', this.email);
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        console.error('Password Hashing Error:', error);
        throw error;
    }
});

module.exports = mongoose.model('User', userSchema);
