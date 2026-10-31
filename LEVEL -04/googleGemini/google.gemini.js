
import "dotenv/config";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const generateAIResponse = async (prompt) => {

    if (!prompt) {
        throw new Error("Prompt is missing");
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });

    return response.text;
};

export default generateAIResponse;
