require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { generateChatResponse } = require('./services/llmFallbackService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic Chat API Route
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const responseText = await generateChatResponse(prompt);
        res.json({ response: responseText });
    } catch (error) {
        console.error('Server error during chat routing:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Connect to MongoDB & Start Server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aimitra')
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to connect to MongoDB', err);
    });
