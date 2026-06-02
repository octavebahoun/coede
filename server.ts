
import { Request } from 'express';
declare module 'express-serve-static-core' {
  interface Request {
    userEmail?: string;
  }
}
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { db, config as firebaseConfig } from "./src/backend/config/firebase";

import authRoutes from "./src/backend/routes/auth.routes";
import usersRoutes from "./src/backend/routes/users.routes";
import challengesRoutes from "./src/backend/routes/challenges.routes";
import duelsRoutes from "./src/backend/routes/duels.routes";
import chatRoutes from "./src/backend/routes/chat.routes";
import opponentChatRoutes from "./src/backend/routes/opponentChat.routes";
import sandboxRoutes from "./src/backend/routes/sandbox.routes";
import { apiLimiter, aiLimiter } from "./src/backend/middlewares/rateLimit";

dotenv.config();

// Seed function to initialize the CodeArena cloud database with elite starting players
async function seedDatabaseIfEmpty() {
  try {
    const usersSnapshot = await db.collection("users").get();
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
        await db.collection("users").doc(u.email).set(u);
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

  // Rate limiting setup
  app.use("/api/", apiLimiter);
  app.use("/api/challenges/generate", aiLimiter);
  app.use("/api/challenges/evaluate", aiLimiter);
  app.use("/api/chat", aiLimiter);
  app.use("/api/opponent/chat", aiLimiter);

  // Seed base database CodeArena on Google Cloud Firestore if empty on startup
  await seedDatabaseIfEmpty();

  // API Route - Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // API Route - Firebase Client Credentials Config
  app.get("/api/firebase-config", (_req, res) => {
    res.json({
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId
    });
  });

  // Modular Routers
  app.use("/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/challenges", challengesRoutes);
  app.use("/api/duels", duelsRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/opponent/chat", opponentChatRoutes);
  app.use("/api/execute", sandboxRoutes);


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
