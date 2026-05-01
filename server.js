/**
 * server.js
 * 
 * Features:
 * - Entry point for the AI Mitra backend application.
 * - Initializes the Express.js application and configures global middleware
 *   (CORS, JSON parsing, serving static files from the 'public' directory).
 * - Connects to the MongoDB database using Mongoose.
 * - Sets up routing by mounting modular route handlers for authentication (/api/auth),
 *   user management (/api/user), and chat features (/api/chat).
 * - Configures application to trust proxy headers for environments like Render.
 * - Starts the HTTP server on the specified port.
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { generateChatResponse } = require('./services/llmFallbackService');

const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable trust proxy for Render/proxies to get correct protocol/host
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);


// Start Server unconditionally so Render always sees an active web service
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Connect to MongoDB asynchronously
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aimitra')
    .then(() => {
        console.log('✅ Connected to MongoDB');
    })
    .catch((err) => {
        console.error('❌ Failed to connect to MongoDB', err);
    });
