import { Router } from 'express';
import { validateChat } from '../middlewares/validation';
import { getGemini, hasGeminiKey } from '../services/gemini';

const router = Router();

// POST /api/chat
router.post('/', validateChat, async (req, res) => {
  const { message, challenge, history = [] } = req.body;
  const hasKey = hasGeminiKey();

  if (!hasKey) {
    return res.json({
      reply: `[Mode Simulation] Bonjour ! C'est GuillaumeD. Pour résoudre "${challenge?.title || "ce défi"}", je te conseille de commencer par décomposer le schéma logique. Déclare une fonction adaptative et n'hésite pas à tester tes variables dans le terminal !`
    });
  }

  try {
    const ai = getGemini();

    const combinedHistory = history.map((h: any) => {
      return {
        role: h.sender === "GuillaumeD" ? "user" : "model",
        parts: [{ text: h.text }]
      };
    });

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
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8
      }
    });

    res.json({ reply: response.text || "Je n'ai pas pu analyser la réponse." });

  } catch (error: any) {
    console.error("Erreur d'assistant chat via Gemini:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
