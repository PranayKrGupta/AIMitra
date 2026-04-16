require('dotenv').config();
const Groq = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');
const { CohereClient } = require('cohere-ai');
const { HfInference } = require('@huggingface/inference');

const ChatLog = require('../models/ChatLog');

// Initialize API Clients
// Using ternaries to prevent server crash if an API key is missing on startup
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
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
async function generateChatResponse(prompt) {
    let finalResponse = '';
    let providerUsed = 'None';
    let fallbackTriggered = false;

    // 1. Try Groq (Optimized for speed/voice)
    try {
        if (!groq) throw new Error("Groq API key missing");
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192', // Fast model commonly used with Groq
        });
        
        finalResponse = chatCompletion.choices[0]?.message?.content || '';
        providerUsed = 'Groq';
    } catch (error) {
        console.warn(`[${new Date().toISOString()}] WARNING: Groq failed or rate limited, falling back to Gemini. Error: ${error.message}`);
        fallbackTriggered = true;

        // 2. Try Gemini
        try {
            if (!ai) throw new Error("Gemini API key missing");
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            finalResponse = response.text || '';
            providerUsed = 'Gemini';
        } catch (geminiError) {
            console.warn(`[${new Date().toISOString()}] WARNING: Gemini failed, falling back to Cohere. Error: ${geminiError.message}`);
            
            // 3. Try Cohere
            try {
                if (!cohere) throw new Error("Cohere API key missing");

                const response = await cohere.generate({
                    prompt: prompt,
                    model: 'command',
                    maxTokens: 300,
                });
                
                finalResponse = response.generations[0]?.text || '';
                providerUsed = 'Cohere';
            } catch (cohereError) {
                console.warn(`[${new Date().toISOString()}] WARNING: Cohere failed, falling back to Hugging Face. Error: ${cohereError.message}`);
                
                // 4. Try Hugging Face
                try {
                    if (!hf) throw new Error("Hugging Face API key missing");

                    const response = await hf.textGeneration({
                        model: 'HuggingFaceH4/zephyr-7b-beta',
                        inputs: prompt,
                        parameters: { max_new_tokens: 300 }
                    });

                    // Depending on the model, HF might return the prompt prepended to the generated text
                    let generatedText = response.generated_text || '';
                    if (generatedText.startsWith(prompt)) {
                        generatedText = generatedText.substring(prompt.length).trim();
                    }
                    
                    finalResponse = generatedText;
                    providerUsed = 'Hugging Face';
                } catch (hfError) {
                    console.error(`[${new Date().toISOString()}] ERROR: All 4 AI APIs failed. Last error from Hugging Face: ${hfError.message}`);
                    finalResponse = "I'm sorry, but I'm currently unable to process your request. Our systems are experiencing high traffic. Please try again later.";
                    providerUsed = 'None';
                }
            }
        }
    }

    // Standardize text format
    finalResponse = finalResponse.trim();

    // Log to MongoDB
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

    return finalResponse;
}

module.exports = {
    generateChatResponse
};
