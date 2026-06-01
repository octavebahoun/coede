import { Request, Response } from 'express';
import { Challenge } from '../models/Challenge';
import { GoogleGenAI, Type } from "@google/genai";

// Utilitaire pour obtenir le client AI (pour l'instant, via Gemini par défaut pour minimiser les changements de modèle IA de la V1)
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY; // Fallback pour garder la logique précédente ou utiliser OpenRouter si configuré dans le futur
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiClient;
}

export const generateChallenge = async (req: Request, res: Response) => {
  const { level = "Intermédiaire", category = "React" } = req.body;
  const userId = req.isAuthenticated() ? (req.user as any)._id : null;

  try {
    const ai = getGemini();
    const prompt = `Génère un défi de programmation en français pour la plateforme CodeArena.
Niveau demandé: ${level}. Catégorie/Langue principale: ${category}.
Produis un défi très intéressant, technique, axé sur les algorithmes, l'optimisation, l'IA, ou le développement moderne.
Génère le JSON exactement selon le schéma spécifié.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Tu es le concepteur de défis senior de CodeArena. Renvoie impérativement du JSON valide.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Nom fascinant du défi" },
            description: { type: Type.STRING, description: "Description complète en Markdown décrivant le problème et les contraintes en français" },
            difficulty: { type: Type.STRING, description: "Facile, Medium, Hard, ou Extrême" },
            duration: { type: Type.INTEGER, description: "Durée recommandée en minutes (ex: 15 ou 20)" },
            initialFiles: {
              type: Type.OBJECT,
              description: "Map de fichiers. Ex: {'main.js': 'content', 'index.html': 'content'}"
            },
            testOutputMocked: { type: Type.STRING, description: "La sortie console attendue en cas de succès des tests" }
          },
          required: ["title", "description", "difficulty", "duration", "initialFiles", "testOutputMocked"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");

    // Création en base
    const challenge = await Challenge.create({
      userId,
      title: data.title || "Défi Inconnu",
      description: data.description || "Aucune description",
      level: level,
      language: category,
      duration: data.duration || 15,
      status: 'pending'
    });

    res.json({
        id: challenge._id,
        title: data.title,
        description: data.description,
        level: level,
        language: [category],
        duration: data.duration || 15,
        difficulty: data.difficulty || "Medium",
        statsType: "success",
        successRate: "35%",
        initialFiles: data.initialFiles || { "main.js": "// Votre code ici" },
        testOutputMocked: data.testOutputMocked || "Test validé !"
    });

  } catch (error: any) {
    console.error("Erreur génération défi:", error);
    res.status(500).json({ error: error.message });
  }
};

export const submitChallenge = async (req: Request, res: Response) => {
    const { challengeId, userFiles, timeUsed, challenge: frontendChallengeData } = req.body;

    try {
        // En V2, on devrait utiliser l'ID pour fetcher depuis la BD. Pour la rétrocompatibilité (V1 passait l'objet `challenge`), on merge.
        let dbChallenge = null;
        if(challengeId) {
            dbChallenge = await Challenge.findById(challengeId);
        }

        if (challengeId && !dbChallenge) return res.status(404).json({ error: "Challenge non trouvé" });

        const ai = getGemini();
        const userCodeStr = JSON.stringify(userFiles);
        const challengeTitle = dbChallenge?.title || frontendChallengeData?.title || "Inconnu";
        const challengeDesc = dbChallenge?.description || frontendChallengeData?.description || "Inconnu";

        const prompt = `Évalue la soumission de l'étudiant pour le défi suivant :
Titre du Défi : ${challengeTitle}
Cahier des charges : ${challengeDesc}

Code fourni par l'utilisateur: ${userCodeStr}

Analyse le code, détecte s'il cherche à tricher ou si son implémentation résout réellement le problème avec inventivité.
Attribue un score numérique global sur 100.
Rassemble les résultats sous forme de critères clairs et renvoie un retour constructif global en français.`;

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "Tu es le correcteur automatique d'algorithme de CodeArena. Tu analyses avec précision, rigueur et pédagogie en français le code fourni. Tu renvoies toujours un format JSON structuré.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "Note globale sur 100" },
                        criteria: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "Nom du critère (ex: Ergonomie, Algorithme, Clarté...)" },
                                    rating: { type: Type.INTEGER, description: "Note pour ce critère sur 100" },
                                    feedback: { type: Type.STRING, description: "Retour d'expérience court pour ce critère" }
                                },
                                required: ["name", "rating", "feedback"]
                            }
                        },
                        globalFeedback: { type: Type.STRING, description: "Commentaire général en français sur la soumission" }
                    },
                    required: ["score", "criteria", "globalFeedback"]
                }
            }
        });

        const data = JSON.parse(response.text || "{}");

        if (dbChallenge) {
            dbChallenge.codeSubmitted = userCodeStr;
            dbChallenge.score = data.score;
            dbChallenge.feedback = data;
            dbChallenge.timeUsed = timeUsed;
            dbChallenge.status = 'completed';
            await dbChallenge.save();
        }

        res.json(data);

    } catch (error: any) {
        console.error("Erreur évaluation défi:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getHistory = async (req: Request, res: Response) => {
    try {
        if (!req.isAuthenticated()) return res.status(401).json({ error: "Non connecté" });
        const userId = (req.user as any)._id;
        const history = await Challenge.find({ userId }).sort({ createdAt: -1 });
        res.json(history);
    } catch(err: any) {
        res.status(500).json({ error: err.message });
    }
};
