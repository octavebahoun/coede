import { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiClient;
}

export const askCoachChat = async (req: Request, res: Response) => {
    const { message, challenge, history = [] } = req.body;
    try {
        const ai = getGemini();
        const combinedHistory = history.map((h: any) => ({
            role: h.sender === "GuillaumeD" || h.sender === "User" ? "user" : "model",
            parts: [{ text: h.text }]
        }));

        const systemInstruction = `Tu es l'assistant coach en direct de l'arène CodeArena.
Ton rôle est de guider pas à pas sans jamais fournir la solution de code complète d'un seul coup.
Encourage l'utilisateur, pose des questions constructives, donne des indices algorithmiques.
Le défi sur lequel l'utilisateur travaille est le suivant :
Titre : ${challenge?.title || "Inconnu"}
Énoncé : ${challenge?.description || "Inconnu"}
Réponds uniquement en français de manière conviviale et motivante de hackeur senior !`;

        const contents = [
            ...combinedHistory,
            { role: "user", parts: [{ text: message }] }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: contents,
            config: { systemInstruction, temperature: 0.8 }
        });

        res.json({ reply: response.text || "Je n'ai pas pu analyser la réponse." });
    } catch(err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const askOpponentChat = async (req: Request, res: Response) => {
    const { message, history = [] } = req.body;
    try {
        const ai = getGemini();
        const combinedHistory = history.map((h: any) => ({
            role: h.sender === "GuillaumeD" || h.sender === "User" ? "user" : "model",
            parts: [{ text: h.text }]
        }));

        const systemInstruction = `Tu es AlexCoder_99, un développeur talentueux et compétitif (Rang: Diamant II, MMR: 2390) participant à un duel de code en temps réel sur la plateforme CodeArena contre l'utilisateur actuel.
Garde tes réponses courtes, directes, légèrement compétitives mais amicales, typiques d'un chat de jeu vidéo de programmation.
Réponds uniquement en français ou avec du jargon technique de dev. Maximum 1 ou 2 phrases. Ne donne pas la solution.`;

        const contents = [
            ...combinedHistory.slice(-10),
            { role: "user", parts: [{ text: message }] }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: contents,
            config: { systemInstruction, temperature: 0.8 }
        });

        res.json({ reply: (response.text || "Que le meilleur gagne !").trim() });
    } catch(err: any) {
        res.status(500).json({ error: err.message });
    }
};