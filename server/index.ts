import express from "express";
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import path from "path";
import dotenv from "dotenv";
import { connectDB } from './config/db';
import { configurePassport } from './config/passport';

import authRoutes from './routes/auth';
import challengeRoutes from './routes/challenges';
import chatRoutes from './routes/chat';
import userRoutes from './routes/users';
import duelRoutes from './routes/duels';

import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupDuelSockets } from './sockets/duel.socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Configurer Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ["GET", "POST"],
        credentials: true
    }
});
setupDuelSockets(io);

// Init DB & Passport
connectDB();
configurePassport();

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false, // À ajuster selon les besoins de Vite/WebContainers en dev
}));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());

// Session config
app.use(session({
    secret: process.env.SESSION_SECRET || 'super_secret_codearena_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codearena'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24h
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/duels', duelRoutes);
app.use('/api/chat', chatRoutes);

// Route legacy explicitement définie
import { askOpponentChat } from './controllers/chatController';
app.post("/api/opponent/chat", askOpponentChat);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve Vite / static client files
if (process.env.NODE_ENV !== "production") {
  import("vite").then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then(vite => {
        app.use(vite.middlewares);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur V2 avec WebSockets actif sur le port ${PORT}`);
});
