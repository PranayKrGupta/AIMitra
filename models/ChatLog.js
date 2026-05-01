/**
 * ChatLog Model
 * 
 * Features:
 * - Stores logs of interactions with AI providers (prompts and final responses).
 * - Tracks which AI provider was used for the response (e.g., Gemini, Cohere).
 * - Records whether the multi-model fallback mechanism was triggered.
 * - Used primarily for analytics, debugging, and monitoring the LLM fallback system
 *   independent of user-specific conversation histories.
 */
const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
    userPrompt: {
        type: String,
        required: true
    },
    finalResponse: {
        type: String,
        required: true
    },
    providerUsed: {
        type: String,
        required: true
    },
    fallbackTriggered: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ChatLog', chatLogSchema);
