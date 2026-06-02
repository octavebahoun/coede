import { Router } from 'express';
import { db, respondWithFirestoreError, OperationType } from '../config/firebase';
import { requireAuth } from '../middlewares/auth';
import { validateJoinDuel } from '../middlewares/validation';

const router = Router();

// POST /api/duels/create
router.post('/create', requireAuth, async (req, res) => {
  const userEmail = req.userEmail as string;
  try {
    const userRef = db.collection("users").doc(userEmail);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }
    const user = userSnap.data() || {};

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

    await db.collection("duels").doc(duelId).set(lobby);
    res.json(lobby);
  } catch (error) {
    respondWithFirestoreError(res, error, OperationType.WRITE, "duels");
  }
});

// POST /api/duels/join
router.post('/join', requireAuth, validateJoinDuel, async (req, res) => {
  const userEmail = req.userEmail as string;
  const { roomId } = req.body;

  try {
    const cleanRoomId = roomId.replace("#", "").trim();
    const querySnap = await db.collection("duels").where("roomId", "==", cleanRoomId).where("status", "==", "waiting").get();

    if (querySnap.empty) {
      return res.status(404).json({ error: "Salon introuvable ou déjà complet." });
    }

    const duelDoc = querySnap.docs[0];
    const matchData = duelDoc.data();

    const userRef = db.collection("users").doc(userEmail);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }
    const user = userSnap.data() || {};

    matchData.player2 = {
      username: user.username,
      avatar: user.avatar,
      level: user.level,
      email: user.email
    };
    matchData.status = "ready";

    await db.collection("duels").doc(matchData.id).set(matchData);
    res.json(matchData);
  } catch (error) {
    respondWithFirestoreError(res, error, OperationType.WRITE, "duels");
  }
});

// GET /api/duels/:roomId
router.get('/:roomId', async (req, res) => {
  try {
    const cleanRoomId = req.params.roomId.replace("#", "").trim();
    const querySnap = await db.collection("duels").where("roomId", "==", cleanRoomId).get();
    if (querySnap.empty) {
      return res.status(404).json({ error: "Duel room not found" });
    }
    res.json(querySnap.docs[0].data());
  } catch (error) {
    respondWithFirestoreError(res, error, OperationType.GET, "duels");
  }
});

export default router;
