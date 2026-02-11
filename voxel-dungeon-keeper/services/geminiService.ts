
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAdvisorBanter = async (event: string, gold: number, minions: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: A dungeon keeper game. The player is an evil overlord. 
      Current Stats: Gold: ${gold}, Minions: ${minions}. 
      Event: ${event}.
      Task: Give a short, snarky, one-sentence comment as the Dark Advisor. Keep it under 15 words.`,
      config: {
        systemInstruction: "You are the 'Dark Advisor', a sarcastic and demanding demon who guides the player in their dungeon management.",
        temperature: 0.9,
      }
    });
    return response.text || "Your dungeon grows, Master.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "My voice fades... but my greed remains.";
  }
};
