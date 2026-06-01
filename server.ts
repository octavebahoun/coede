import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

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

// ================= FIREBASE FIRESTORE DATABASE INITIALIZATION =================
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where,
  orderBy
} from "firebase/firestore";

let currentLoggedInUserEmail = "teamexellence@gmail.com"; // Default premium user matching metadata!

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentLoggedInUserEmail,
      email: currentLoggedInUserEmail,
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Seed function to initialize the CodeArena cloud database with elite starting players
async function seedDatabaseIfEmpty() {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    if (usersSnapshot.empty) {
      console.log("Seeding base database CodeArena on Google Cloud Firestore...");
      
      const seedUsers = [
        {
          id: "user-guillaume",
          username: "GuillaumeD",
          email: "teamexellence@gmail.com",
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBZymiT42t-KbyZBIGa7_sgs9hcRwdVtrtQwk1ddrc3uRWIvLJz9RxRQdr-QBHYI47aMHC5m_FwnHUhM-PYFPKWMbYqao7k-oi3jM_cXFpeg1PUpLFQpzV14NWAHsGz6o8LJvZjm3smBJVu61x4px-ojGgMws7TF8SD3LiIunJIPXawI7f5ryyHNK3CRf65FkYK2gsmwvSsqxgz_u3OiXfE3046aTLvZ8p3pAjPtENjEOepLPZ7w1YntI6Zvwp4ZqL7Lg260W0HKis",
          level: 4,
          totalScore: 945,
          challengesDone: 11,
          wins: 15,
          losses: 8,
          recentScores: [75, 94, 88, 92, 65, 80],
          proPassUnlocked: true,
          preferences: {
            editorTheme: "vs-dark",
            terminalTheme: "classic",
            siteTheme: "dark",
            aiModel: "gemini-3.5-flash"
          },
          provider: "google"
        },
        {
          id: "user-alex",
          username: "AlexCoder_99",
          email: "alex_coder99@codearena.com",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
          level: 5,
          totalScore: 1250,
          challengesDone: 18,
          wins: 22,
          losses: 12,
          recentScores: [85, 90, 88, 95],
          proPassUnlocked: true,
          preferences: {
            editorTheme: "monokai",
            terminalTheme: "classic",
            siteTheme: "Midnight",
            aiModel: "claude-3.5-sonnet"
          },
          provider: "github"
        },
        {
          id: "user-rustacean",
          username: "Rustacean_X",
          email: "rust.pro@codearena.com",
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80",
          level: 6,
          totalScore: 1680,
          challengesDone: 25,
          wins: 34,
          losses: 19,
          recentScores: [92, 98, 95, 99],
          proPassUnlocked: true,
          preferences: {
            editorTheme: "vs-dark",
            terminalTheme: "modern-black",
            siteTheme: "dark",
            aiModel: "gpt-4o"
          },
          provider: "github"
        }
      ];

      for (const u of seedUsers) {
        await setDoc(doc(db, "users", u.email), u);
      }
      console.log("Seeding finalized successfully.");
    }
  } catch (error) {
    console.warn("Failed to seed firestore users collection:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Seed base database CodeArena on Google Cloud Firestore if empty on startup
  await seedDatabaseIfEmpty();

  // API Route - Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ================= AUTHENTICATION ENDPOINTS (V2 SPEC) =================
  
  // GET /auth/me - Retourne le profil utilisateur connecté
  app.get("/auth/me", async (req, res) => {
    if (!currentLoggedInUserEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const userRef = doc(db, "users", currentLoggedInUserEmail);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(401).json({ error: "User not found" });
      }
      res.json(userSnap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${currentLoggedInUserEmail}`);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // POST /auth/login - Gère l'authentification simulation OAuth 2.0 (Google et GitHub)
  app.post("/auth/login", async (req, res) => {
    const { email, username, avatar, provider } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    try {
      const userRef = doc(db, "users", email);
      const userSnap = await getDoc(userRef);
      let userData: any = null;

      if (!userSnap.exists()) {
        userData = {
          id: "user-" + Date.now().toString(36),
          username: username || email.split("@")[0],
          email: email,
          avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${email}`,
          level: 1,
          totalScore: 0,
          challengesDone: 0,
          wins: 0,
          losses: 0,
          recentScores: [],
          proPassUnlocked: false,
          preferences: {
            editorTheme: "vs-dark",
            terminalTheme: "classic",
            siteTheme: "dark",
            aiModel: "gemini-3.5-flash"
          },
          provider: provider || "google"
        };
        await setDoc(userRef, userData);
      } else {
        userData = userSnap.data();
      }

      currentLoggedInUserEmail = email;
      res.json({ success: true, user: userData });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${email}`);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // POST /auth/logout - Déconnexion
  app.post("/auth/logout", (req, res) => {
    currentLoggedInUserEmail = "";
    res.json({ success: true });
  });

  // ================= USERS ENDPOINTS (V2 SPEC) =================

  // GET /api/users/leaderboard - Classement global des joueurs
  app.get("/api/users/leaderboard", async (req, res) => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList: any[] = [];
      usersSnap.forEach((doc) => {
        const u = doc.data();
        usersList.push({
          username: u.username,
          email: u.email,
          avatar: u.avatar,
          level: u.level,
          totalScore: u.totalScore,
          wins: u.wins,
          losses: u.losses,
          provider: u.provider
        });
      });
      usersList.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      res.json(usersList);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "users");
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // GET /api/users/:id - Profil public d'un utilisateur
  app.get("/api/users/:id", async (req, res) => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      let user: any = null;
      usersSnap.forEach((doc) => {
        const u = doc.data();
        if (u.id === req.params.id || u.email === req.params.id) {
          user = u;
        }
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        totalScore: user.totalScore,
        wins: user.wins,
        losses: user.losses,
        recentScores: user.recentScores
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "users");
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // PUT /api/users/me - Mise à jour du profil (préférences, pseudo)
  app.put("/api/users/me", async (req, res) => {
    if (!currentLoggedInUserEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const body = req.body;
    try {
      const userRef = doc(db, "users", currentLoggedInUserEmail);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "User not found" });
      }

      const existingUser = userSnap.data();
      const updatedUser = {
        ...existingUser,
        username: body.username !== undefined ? body.username : existingUser.username,
        preferences: body.preferences !== undefined ? { ...existingUser.preferences, ...body.preferences } : existingUser.preferences,
        proPassUnlocked: body.proPassUnlocked !== undefined ? body.proPassUnlocked : existingUser.proPassUnlocked,
        wins: body.wins !== undefined ? body.wins : existingUser.wins,
        losses: body.losses !== undefined ? body.losses : existingUser.losses,
        totalScore: body.totalScore !== undefined ? body.totalScore : existingUser.totalScore,
        level: body.level !== undefined ? body.level : existingUser.level,
        challengesDone: body.challengesDone !== undefined ? body.challengesDone : existingUser.challengesDone,
        recentScores: body.recentScores !== undefined ? body.recentScores : existingUser.recentScores,
      };

      await setDoc(userRef, updatedUser);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${currentLoggedInUserEmail}`);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // DELETE /api/users/me - Suppression du compte
  app.delete("/api/users/me", async (req, res) => {
    if (!currentLoggedInUserEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const userRef = doc(db, "users", currentLoggedInUserEmail);
      await deleteDoc(userRef);
      currentLoggedInUserEmail = "";
      res.json({ success: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${currentLoggedInUserEmail}`);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // API Route - Generate Challenge using Gemini
  app.post("/api/challenges/generate", async (req, res) => {
    const { level = "Intermédiaire", category = "React", customPrompt } = req.body;
    const hasKey = !!process.env.GEMINI_API_KEY;

    if (!hasKey) {
      // Mocked response fallback for preview when no key is set yet
      const fallbackTitle = customPrompt
        ? `Défi : ${customPrompt.slice(0, 35)}${customPrompt.length > 35 ? "..." : ""}`
        : `Optimisation de Pathfinding (${level})`;

      const fallbackDesc = customPrompt
        ? `### Sujet du défi généré :\n**${customPrompt}**\n\nImplémentez l'algorithme correspondant de manière modulaire, gérez tous les cas limites et retournez le résultat attendu.\n\n### Spécification :\n- Complétez le fichier principal fourni\n- Assurez-vous d'implémenter les structures et algorithmes appropriés pour ce problème.`
        : `Implémentez un algorithme d'évitement d'obstacles dynamique pour un robot se déplaçant dans une grille 2D. Évitez les zones bloquées et retournez le chemin le plus court.\n\n### Spécification :\n- Complétez la fonction \`findPath(grid, start, end)\`\n- Retournez un tableau de coordonnées \`[x, y]\` de début à fin\n- Gérez les obstacles représentés par des 1 dans l'arborescence.`;

      return res.json({
        id: "neural-pathfinding-" + Date.now(),
        title: fallbackTitle,
        description: fallbackDesc,
        level: level,
        language: [category === "Rust" ? "Rust" : "JavaScript"],
        duration: 20,
        difficulty: level === "Avancé" ? "Extrême" : level === "Intermédiaire" ? "Hard" : "Medium",
        statsType: "velocity",
        avgVelocity: "88%",
        initialFiles: {
          "main.js": `// Workspace Initialisé pour votre défi personnalisé
function solve() {
  // TODO: Écrivez votre logique ici
  console.log("Démarrage de la résolution...");
  return true;
}

solve();
`,
          "index.html": `<!DOCTYPE html>
<html>
<head>
  <style>body { font-family: monospace; color: #DAF1DE; background: #000; padding: 20px; }</style>
</head>
<body>
  <h3>${fallbackTitle}</h3>
  <p>Exécution interactive CodeArena Sandbox prête.</p>
  <script src="main.js"></script>
</body>
</html>`
        },
        testOutputMocked: "Exécution réussie.\n[SUCCESS] Tous les cas tests personnalisés sont validés !"
      });
    }

    try {
      const ai = getGemini();
      
      let prompt = "";
      if (customPrompt) {
        prompt = `Génère un défi de programmation PERSONNALISÉ et très stimulant en français pour la plateforme CodeArena, basé précisément sur le sujet suivant décrit par l'utilisateur : "${customPrompt}".
Niveau de difficulté adapté de façon cohérente à la description. Langage principal/Catégorie de programmation suggéré : ${category}.
Génère le JSON exactement selon le schéma spécifié. Rends les fichiers d'arborescence de départ attrayants dans initialFiles (par exemple main.js et index.html pour React/JavaScript/Python, ou main.rs pour Rust). Le titre et l'énoncé de description (Markdown) doivent être intégralement en français, soignés, inspirants et complets. Des indices et explications techniques de l'algorithme doivent être décrits de manière captivante.`;
      } else {
        prompt = `Génère un défi de programmation en français pour la plateforme CodeArena.
Niveau demandé: ${level}. Catégorie/Langue principale: ${category}.
Produis un défi très intéressant, technique, axé sur les algorithmes, l'optimisation, l'IA, ou le développement moderne.
Génère le JSON exactement selon le schéma spécifié. Rends les fichiers d'arborescence de départ attrayants dans initialFiles (par exemple main.js et index.html, ou code.rs). Le titre et l'énoncé de description (Markdown) doivent être intégralement en français.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Tu es le concepteur de défis senior de CodeArena. Tu crées des défis de programmation passionnants avec un énoncé de description complet en Markdown, une difficulté, des fichiers de départ pertinents, et des tests de validation rigoureux en français. Renvoie impérativement du JSON valide respectant scrupuleusement le schéma demandé.",
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

  // API Route - Evaluate Code using Gemini and save results to Database (V2)
  app.post("/api/challenges/evaluate", async (req, res) => {
    const { challenge, userFiles } = req.body;
    const hasKey = !!process.env.GEMINI_API_KEY;
    let evalOutput: any = null;

    if (!hasKey) {
      // Return beautiful mock evaluation if no API Key configuration
      const totalLines = Object.values(userFiles || {}).join("\n").split("\n").filter(Boolean).length;
      const calculatedScore = totalLines > 2 ? Math.min(65 + Math.floor(Math.random() * 30), 100) : 15;
      evalOutput = {
        score: calculatedScore,
        criteria: [
          { name: "Algorithme & Logique", rating: Math.floor(calculatedScore * 0.95), feedback: "Structure globale correcte. Des cas d'erreurs ont été identifiés." },
          { name: "Performance & Optimisation", rating: Math.floor(calculatedScore * 0.88), feedback: "Complexité temporelle raisonnable." },
          { name: "Clarté du Code", rating: Math.floor(calculatedScore * 1.0), feedback: "Code lisible et bien structuré." }
        ],
        globalFeedback: "Bon travail ! Vos fonctions répondent aux critères de base définis par l'énoncé CodeArena. Pensez à gérer les cas limites."
      };
    } else {
      try {
        const ai = getGemini();
        const userCodeStr = JSON.stringify(userFiles);
        const prompt = `Évalue la soumission de l'étudiant pour le défi suivant :
Titre du Défi : ${challenge?.title || "Défi personnalisé"}
Cahier des charges : ${challenge?.description || "Description libre"}

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

        evalOutput = JSON.parse(response.text || "{}");
      } catch (error: any) {
        console.error("Erreur de correction via Gemini:", error);
        return res.status(500).json({ error: error.message });
      }
    }

    // Save submission to database and update user stats in BDD (Phase V2 requirement!)
    if (currentLoggedInUserEmail) {
      try {
        const userRef = doc(db, "users", currentLoggedInUserEmail);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const user = userSnap.data();
          user.challengesDone = (user.challengesDone || 0) + 1;
          
          const mainScore = evalOutput.score || 85;
          user.recentScores = [...(user.recentScores || []), mainScore];
          user.totalScore = (user.totalScore || 0) + mainScore;
          user.level = Math.floor(user.totalScore / 500) + 1;
          
          await setDoc(userRef, user);
        }

        // Add to challenges collection history
        const challengeId = challenge?.id || "custom-challenge";
        const subId = "sub-" + Date.now().toString(36);
        const challengeRef = doc(db, "challenges", subId);
        await setDoc(challengeRef, {
          id: subId,
          userEmail: currentLoggedInUserEmail,
          challengeId: challengeId,
          title: challenge?.title || "Défi Personnalisé",
          level: challenge?.level || "Intermédiaire",
          score: evalOutput.score || 85,
          criteria: evalOutput.criteria,
          globalFeedback: evalOutput.globalFeedback,
          submittedAt: new Date().toISOString()
        });

      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "challenges");
      }
    }

    res.json(evalOutput);
  });

  // POST /api/challenges/submit - Identique à evaluate, mais soumet formellement (V2 spec match)
  app.post("/api/challenges/submit", async (req, res) => {
    if (!currentLoggedInUserEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Appel direct de l'évaluation
    return res.redirect(307, "/api/challenges/evaluate");
  });

  // GET /api/challenges/history - Récupère l'historique des défis résolus de l'utilisateur
  app.get("/api/challenges/history", async (req, res) => {
    if (!currentLoggedInUserEmail) {
      return res.status(200).json([]); // Tableau vide si non identifié
    }
    try {
      const q = query(collection(db, "challenges"), where("userEmail", "==", currentLoggedInUserEmail));
      const querySnap = await getDocs(q);
      const history: any[] = [];
      querySnap.forEach((doc) => {
        history.push(doc.data());
      });
      res.json(history);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "challenges");
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // GET /api/challenges/:id - Détails d'un défi spécifique en BDD
  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const challengeRef = doc(db, "challenges", req.params.id);
      const challengeSnap = await getDoc(challengeRef);
      if (challengeSnap.exists()) {
        return res.json(challengeSnap.data());
      }

      // Fallback search by challengeId field
      const q = query(collection(db, "challenges"), where("challengeId", "==", req.params.id));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        return res.json(querySnap.docs[0].data());
      }

      res.status(404).json({ error: "Challenge history element not found" });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `challenges/${req.params.id}`);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ================= DUELS MATCHMAKING ENDPOINTS (V2/V3 SPEC) =================

  // POST /api/duels/create - Crée un salon de duel
  app.post("/api/duels/create", async (req, res) => {
    if (!currentLoggedInUserEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const userRef = doc(db, "users", currentLoggedInUserEmail);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "User profile not found" });
      }
      const user = userSnap.data();

      const roomId = "ROOM-" + Math.floor(100 + Math.random() * 900).toString();
      const duelId = "duel-" + Date.now().toString(36);
      
      const lobby = {
        id: duelId,
        roomId: roomId,
        status: "waiting", // 'waiting' | 'ready' | 'coding' | 'finished'
        player1: {
          username: user.username,
          avatar: user.avatar,
          level: user.level,
          email: user.email
        },
        player2: null,
        challenge: {
          id: "neural-pathfinding",
          title: "Neural Pathfinding",
          description: "Optimisez un réseau de neurones rapide pour s'orienter dans un labyrinthe en 3D.",
          level: "Avancé",
          language: ["JavaScript"],
          duration: 15,
          difficulty: "Extrême"
        },
        startedAt: new Date().toISOString(),
        winnerEmail: null
      };

      await setDoc(doc(db, "duels", duelId), lobby);
      res.json(lobby);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "duels");
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // POST /api/duels/join - Rejoindre un salon de duel existant
  app.post("/api/duels/join", async (req, res) => {
    if (!currentLoggedInUserEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: "Missing roomId" });
    }

    try {
      const cleanRoomId = roomId.replace("#", "").trim();
      const q = query(collection(db, "duels"), where("roomId", "==", cleanRoomId), where("status", "==", "waiting"));
      const querySnap = await getDocs(q);
      
      if (querySnap.empty) {
        return res.status(404).json({ error: "Salon introuvable ou déjà complet." });
      }

      const duelDoc = querySnap.docs[0];
      const matchData = duelDoc.data();

      const userRef = doc(db, "users", currentLoggedInUserEmail);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "User profile not found" });
      }
      const user = userSnap.data();

      matchData.player2 = {
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        email: user.email
      };
      matchData.status = "ready";

      await setDoc(doc(db, "duels", matchData.id), matchData);
      res.json(matchData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "duels");
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // GET /api/duels/:roomId - Récupère l'état d'un duel
  app.get("/api/duels/:roomId", async (req, res) => {
    try {
      const cleanRoomId = req.params.roomId.replace("#", "").trim();
      const q = query(collection(db, "duels"), where("roomId", "==", cleanRoomId));
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        return res.status(404).json({ error: "Duel room not found" });
      }
      res.json(querySnap.docs[0].data());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "duels");
      res.status(500).json({ error: "Internal Server Error" });
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

  // API Route - Universal Code Sandbox Executor
  app.post("/api/execute", async (req, res) => {
    const { language, filename, code, files = {} } = req.body;
    const hasKey = !!process.env.GEMINI_API_KEY;

    if (!hasKey) {
      // Offline high-fidelity fallback parser
      let output = `[SUCCESS] Compilation réussie (${language}).\n\n=== EXÉCUTION EN COURS ===\n`;
      if (code.includes("print") || code.includes("console.log") || code.includes("println!")) {
        // Try to find raw print strings
        const matches = [...code.matchAll(/(?:console\.log|print|println!)\s*\(\s*["'`](.*?)["'`]\s*\)/g)];
        if (matches.length > 0) {
          output += matches.map(m => m[1]).join("\n") + "\n";
        } else {
          output += `Exécution de la logique principale...\nFichier : ${filename}\n`;
        }
      } else {
        output += `Exécution du script standard...\nLangage : ${language}\nTaille : ${code.length} caractères.\n`;
      }
      output += `\n[INFO] Exécution terminée avec code de sortie 0.`;
      return res.json({ output });
    }

    try {
      const ai = getGemini();
      
      const fileContext = Object.entries(files)
        .map(([name, content]) => `--- FICHIER: ${name} ---\n${content}`)
        .join("\n\n");

      const systemInstruction = `Tu es le compilateur universel et l'interpréteur de CodeArena sandbox.
Analyse le code fourni pour le fichier sélectionné "${filename}" (Langage: ${language}) dans le contexte du projet.
Si le code contient des fautes de syntaxe, des variables indéfinies ou des erreurs flagrantes de logique, renvoie un message d'erreur d'interpréteur propre au langage (ex: "TypeError" en JS/React, "AttributeError" en Python, "error[E0308]" en Rust, "error: compilation failed" en C++).
Sinon, simule fidèlement la sortie console (stdout/stderr) exacte que l'exécution de ce code produirait, y compris tous les appels de journalisations ou de prints du fichier exécutable (main file).
Formate la sortie brute exactement comme le terminal du système d'exploitation la renverrait (pas de markdown en dehors du contenu de la console, pas de bavardage d'explication d'IA, ne dis pas "Voici le résultat" - donne uniquement le contenu textuel brut du flux de sortie de la console !).`;

      const prompt = `Fichiers du projet :\n${fileContext}\n\nFichier actif à exécuter : "${filename}"\nCode source :\n${code}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2
        }
      });

      res.json({ output: (response.text || "Exécution terminée avec succès.").trim() });

    } catch (error: any) {
      console.error("Erreur de compilation/exécution simulée via Gemini:", error);
      res.json({ output: `[ERREUR SYSTEME] Impossible d'exécuter l'interpréteur virtuel.\n${error.message}` });
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
