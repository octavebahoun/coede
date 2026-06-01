import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY non fournie. Utilisation des réponses simulées de secours.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route - Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // API Route - Generate Challenge using Gemini
  app.post("/api/challenges/generate", async (req, res) => {
    const { level = "Intermédiaire", category = "React" } = req.body;
    const hasKey = !!process.env.GEMINI_API_KEY;

    if (!hasKey) {
      // Mocked response fallback for preview when no key is set yet
      return res.json({
        id: "neural-pathfinding-" + Date.now(),
        title: `Optimisation de Pathfinding (${level})`,
        description: `Implémentez un algorithme d'évitement d'obstacles dynamique pour un robot se déplaçant dans une grille 2D. Évitez les zones bloquées et retournez le chemin le plus court.\n\n### Spécification :\n- Complétez la fonction \`findPath(grid, start, end)\`\n- Retournez un tableau de coordonnées \`[x, y]\` de début à fin\n- Gérez les obstacles représentés par des 1 dans l'arborescence.`,
        level: level,
        language: [category === "Rust" ? "Rust" : "JavaScript"],
        duration: 15,
        difficulty: level === "Avancé" ? "Extrême" : level === "Intermédiaire" ? "Hard" : "Medium",
        statsType: "velocity",
        avgVelocity: "88%",
        initialFiles: {
          "main.js": `// Algorithme de pathfinding dynamique
function findPath(grid, start, end) {
  // TODO: Implémenter BFS, Dijkstra ou A*
  console.log("Recherche du chemin de", start, "à", end);
  return [];
}

// Exemple d'usage
const grid = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0]
];
console.log(findPath(grid, [0,0], [2,2]));
`,
          "index.html": `<!DOCTYPE html>
<html>
<head>
  <style>body { font-family: monospace; color: #DAF1DE; }</style>
</head>
<body>
  <h3>Visualiseur de Labyrinthe</h3>
  <div id="grid"></div>
  <script src="main.js"></script>
</body>
</html>`
        },
        testOutputMocked: "Chemin trouvé avec succès en 4 étapes.\n[INFO] Test réussi !"
      });
    }

    try {
      const ai = getGemini();
      const prompt = `Génère un défi de programmation en français pour la plateforme CodeArena.
Niveau demandé: ${level}. Catégorie/Langue principale: ${category}.
Produis un défi très intéressant, technique, axé sur les algorithmes, l'optimisation, l'IA, ou le développement moderne.
Génère le JSON exactement selon le schéma spécifié. Rends les fichiers d'arborescence de départ attrayants dans initialFiles (par exemple main.js et index.html, ou code.rs). Le titre et l'énoncé de description (Markdown) doivent être intégralement en français.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Tu es le concepteur de défis senior de CodeArena. Tu crées des défis de programmation passionnants avec un énoncé clair, une difficulté, des fichiers de départ, et des tests de validation rigoureux en français. Renvoie impérativement du JSON valide.",
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
      res.json({
        id: "dyn-" + Date.now(),
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
      console.error("Erreur de génération de défi via Gemini:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route - Evaluate Code using Gemini
  app.post("/api/challenges/evaluate", async (req, res) => {
    const { challenge, userFiles } = req.body;
    const hasKey = !!process.env.GEMINI_API_KEY;

    if (!hasKey) {
      // Return beautiful mock evaluation if no API Key configuration
      const totalLines = Object.values(userFiles || {}).join("\n").split("\n").filter(Boolean).length;
      const calculatedScore = totalLines > 2 ? Math.min(65 + Math.floor(Math.random() * 30), 100) : 15;
      return res.json({
        score: calculatedScore,
        criteria: [
          { name: "Algorithme & Logique", rating: Math.floor(calculatedScore * 0.95), feedback: "Structure globale correcte. Des cas d'erreurs ont été identifiés." },
          { name: "Performance & Optimisation", rating: Math.floor(calculatedScore * 0.88), feedback: "Complexité temporelle raisonnable." },
          { name: "Clarté du Code", rating: Math.floor(calculatedScore * 1.0), feedback: "Code lisible et bien structuré." }
        ],
        globalFeedback: "Bon travail ! Vos fonctions répondent aux critères de base définis par l'énoncé CodeArena. Pensez à gérer les cas limites."
      });
    }

    try {
      const ai = getGemini();
      const userCodeStr = JSON.stringify(userFiles);
      const prompt = `Évalue la soumission de l'étudiant pour le défi suivant :
Titre du Défi : ${challenge.title}
Cahier des charges : ${challenge.description}

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
      res.json(data);

    } catch (error: any) {
      console.error("Erreur de correction via Gemini:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route - Ask Chat Coach
  app.post("/api/chat", async (req, res) => {
    const { message, challenge, history = [] } = req.body;
    const hasKey = !!process.env.GEMINI_API_KEY;

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

      // Insert target instructions to prevent giving straight solutions
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

  // API Route - Dynamic Opponent Chat
  app.post("/api/opponent/chat", async (req, res) => {
    const { message, history = [] } = req.body;
    const hasKey = !!process.env.GEMINI_API_KEY;

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

  // Serve Vite / static client files
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur actif sur le port ${PORT}`);
  });
}

startServer();
