/**
 * Conversation Model
 * 
 * Features:
 * - Represents a specific chat session or thread for a user.
 * - Links to the User model to ensure data ownership and privacy.
 * - Stores a dynamically generated title based on the user's initial prompt.
 * - Tracks timestamps (createdAt, updatedAt) for sorting chat history.
 * - Includes a pre-save hook to automatically update the 'updatedAt' field 
 *   whenever new messages are added or the conversation is modified.
 */
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

conversationSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Conversation', conversationSchema);
