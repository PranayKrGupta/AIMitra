const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');
const { generateChatResponse } = require('../services/llmFallbackService');

// Require auth for all chat routes
router.use(requireAuth);

// GET /api/chat/history - Get all conversations for a user
router.get('/history', async (req, res) => {
    try {
        const conversations = await Conversation.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to retrieve chat history' });
    }
});

// GET /api/chat/:conversationId - Get messages for a specific conversation
router.get('/:conversationId', async (req, res) => {
    try {
        // Verify ownership
        const convo = await Conversation.findOne({ _id: req.params.conversationId, userId: req.user.userId });
        if (!convo) return res.status(404).json({ error: 'Conversation not found' });

        const messages = await Message.find({ conversationId: convo._id }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to retrieve messages' });
    }
});

// POST /api/chat - Process new message (replaces the simple /api/chat block in server.js)
router.post('/', async (req, res) => {
    try {
        const { prompt, conversationId } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        let activeConvoId = conversationId;

        // 1. If no conversationId is passed, this is a "New Chat" -> create the Conversation doc
        if (!activeConvoId) {
            // Generate a small title from the prompt
            let title = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
            const newConvo = new Conversation({
                userId: req.user.userId,
                title: title
            });
            await newConvo.save();
            activeConvoId = newConvo._id;
        } else {
            // Verify ownership
            const checkConvo = await Conversation.findOne({ _id: activeConvoId, userId: req.user.userId });
            if (!checkConvo) return res.status(404).json({ error: 'Conversation not found' });
            
            // Update timestamp
            checkConvo.updatedAt = Date.now();
            await checkConvo.save();
        }

        // 2. Save User Message
        const userMsg = new Message({
            conversationId: activeConvoId,
            role: 'user',
            content: prompt
        });
        await userMsg.save();

        // 3. Generate LLM Response
        // Note: Currently generateChatResponse internally saves a ChatLog. 
        // We'll capture its text return and create our structured Message anyway,
        // or we could refactor llmFallbackService. For now, it works.
        const responseText = await generateChatResponse(prompt);

        // 4. Save Bot Message
        const botMsg = new Message({
            conversationId: activeConvoId,
            role: 'bot',
            content: responseText,
            providerUsed: 'LLM Service' // Ideally we extract this from the service if we refactored
        });
        await botMsg.save();

        // 5. Return payload
        res.json({
            conversationId: activeConvoId,
            response: responseText
        });

    } catch (error) {
        console.error('Server error during chat routing:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
