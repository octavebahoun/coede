import { Router } from 'express';
import { getGemini, hasGeminiKey } from '../services/gemini';

const router = Router();

// POST /api/opponent/chat
router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;
  const hasKey = hasGeminiKey();

  if (!hasKey) {
    const fallbacks = [
      "Bien joué, mais j'attends de voir ton temps d'exécution !",
      "Je suis en train d'optimiser les boucles principales, ça va faire mal.",
      "Pas mal comme idée, mais mon implémentation sera ultra rapide !",
      "Concentration maximale de mon côté. Que le meilleur gagne !",
      "Tu t'en sors sur ce défi ?"
    ];
    const reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return res.json({ reply: reply });
  }

  try {
    const ai = getGemini();

    const combinedHistory = history.map((h: any) => {
      return {
        role: h.sender === "GuillaumeD" ? "user" : "model",
        parts: [{ text: h.text }]
      };
    });

    const systemInstruction = `Tu es AlexCoder_99, un développeur talentueux et compétitif (Rang: Diamant II, MMR: 2390) participant à un duel de code en temps réel sur la plateforme CodeArena contre l'utilisateur "GuillaumeD".
Garde tes réponses courtes, directes, légèrement compétitives mais amicales, typiques d'un chat de jeu vidéo de programmation (salutations simples, vannes légères sur le code, termes de dev).
Réponds uniquement en français ou avec du jargon technique de dev (ex: "Rust", "O(N)", "compiler", "V8").
Maximum 1 ou 2 phrases courtes par message. Ne donne pas la solution du problème.`;

    const contents = [
      ...combinedHistory.slice(-10),
      { role: "user", parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8
      }
    });

    res.json({ reply: (response.text || "Que le meilleur gagne !").trim() });

  } catch (error: any) {
    console.error("Erreur d'assistant rival chat via Gemini:", error);
    res.json({ reply: "Concentrons-nous sur le code !" });
  }
});

export default router;
