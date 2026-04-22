require('dotenv').config();
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { CohereClient } = require('cohere-ai');
const { HfInference } = require('@huggingface/inference');

const ChatLog = require('../models/ChatLog');

// Initialize API Clients
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const cohere = process.env.COHERE_API_KEY ? new CohereClient({ token: process.env.COHERE_API_KEY }) : null;
const hf = process.env.HUGGINGFACE_API_KEY ? new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

/**
 * Generates a chat response using a cascading fallback mechanism.
 * Tries Groq -> Gemini -> Cohere -> Hugging Face.
 * Logs the interaction to MongoDB.
 * 
 * @param {string} prompt - The user's input prompt.
 * @returns {Promise<string>} The generated response text.
 */
async function generateChatResponse(prompt, requestedModel = 'auto') {
    let finalResponse = '';
    let providerUsed = 'None';
    let fallbackTriggered = false;

    // Helper functions for each API
    const runGroq = async () => {
        if (!groq) throw new Error("Groq API key missing or invalid");
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192',
        });
        return { text: chatCompletion.choices[0]?.message?.content || '', provider: 'Groq' };
    };

    const runGemini = async () => {
        if (!genAI) throw new Error("Gemini API key missing or invalid");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        const response = await result.response;
        return { text: response.text() || '', provider: 'Gemini' };
    };

    const runCohere = async () => {
        if (!cohere) throw new Error("Cohere API key missing or invalid");
        const response = await cohere.chat({ message: prompt });
        return { text: response.text || '', provider: 'Cohere' };
    };

    const runHF = async () => {
        if (!hf) throw new Error("Hugging Face API key missing or invalid");
        const response = await hf.textGeneration({
            model: 'HuggingFaceH4/zephyr-7b-beta',
            inputs: prompt,
            parameters: { max_new_tokens: 300 }
        });
        let generatedText = response.generated_text || '';
        if (generatedText.startsWith(prompt)) {
            generatedText = generatedText.substring(prompt.length).trim();
        }
        return { text: generatedText, provider: 'Hugging Face' };
    };

    try {
        if (requestedModel === 'gemini') {
            try {
                const res = await runGemini();
                finalResponse = res.text; providerUsed = res.provider;
            } catch (e) {
                console.warn(`[${new Date().toISOString()}] Gemini Quota/Error, falling back to Cohere.`, e.message);
                fallbackTriggered = true;
                const res = await runCohere();
                finalResponse = res.text; providerUsed = res.provider;
            }
        } else if (requestedModel === 'cohere') {
            try {
                const res = await runCohere();
                finalResponse = res.text; providerUsed = res.provider;
            } catch (e) {
                console.warn(`[${new Date().toISOString()}] Cohere Quota/Error, falling back to Gemini.`, e.message);
                fallbackTriggered = true;
                const res = await runGemini();
                finalResponse = res.text; providerUsed = res.provider;
            }
        } else {
            // Auto Mode or specific models like Groq/HF (standard chain: Groq -> Gemini -> Cohere -> HF)
            try {
                const res = await runGroq();
                finalResponse = res.text; providerUsed = res.provider;
            } catch (e1) {
                fallbackTriggered = true;
                try {
                    const res = await runGemini();
                    finalResponse = res.text; providerUsed = res.provider;
                } catch (e2) {
                    try {
                        const res = await runCohere();
                        finalResponse = res.text; providerUsed = res.provider;
                    } catch (e3) {
                        try {
                            const res = await runHF();
                            finalResponse = res.text; providerUsed = res.provider;
                        } catch (e4) {
                            throw e4; // All failed
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR: AI Provider failed. Error: ${error.message}`);
        if (fallbackTriggered) {
            finalResponse = "As AI Mitra, I am currently operating in offline mode. Both my primary and backup AI providers (Gemini & Cohere) are currently unavailable or have reached their quotas. How can I help you today?";
        } else {
            finalResponse = `As AI Mitra, I am currently operating in offline mode. The requested AI provider (${requestedModel}) is unavailable. How can I help you today?`;
        }
        providerUsed = 'Offline Fallback';
    }

    finalResponse = finalResponse.trim();

    try {
        const logEntry = new ChatLog({
            userPrompt: prompt,
            finalResponse: finalResponse,
            providerUsed: providerUsed,
            fallbackTriggered: fallbackTriggered
        });
        await logEntry.save();
    } catch (dbError) {
        console.error(`[${new Date().toISOString()}] ERROR: Failed to log interaction to MongoDB. Error: ${dbError.message}`);
    }

    return { text: finalResponse, provider: providerUsed };
}

module.exports = {
    generateChatResponse
};
