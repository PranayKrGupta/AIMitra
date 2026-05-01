/**
 * Feedback Model
 * 
 * Features:
 * - Stores user-submitted feedback about the AI Mitra application.
 * - Links feedback to the specific User who submitted it.
 * - Enforces a rating scale of 1 to 5 stars.
 * - Captures additional textual comments provided by the user.
 * - Automatically tracks the submission timestamp.
 */
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
