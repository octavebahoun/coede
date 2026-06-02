import { Router } from 'express';
import { db, respondWithFirestoreError, OperationType } from '../config/firebase';
import { requireAuth } from '../middlewares/auth';
import { validateUpdateMe } from '../middlewares/validation';

const router = Router();

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
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
    respondWithFirestoreError(res, error, OperationType.LIST, 'users');
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
    let user: any = null;
    usersSnap.forEach((doc) => {
      const u = doc.data();
      if (u.id === req.params.id || u.email === req.params.id) {
        user = u;
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
    respondWithFirestoreError(res, error, OperationType.LIST, 'users');
  }
});

// PUT /api/users/me
router.put('/me', requireAuth, validateUpdateMe, async (req, res) => {
  const userEmail = req.userEmail as string;
  const body = req.body;
  try {
    const userRef = db.collection('users').doc(userEmail);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User not found' });
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

    await userRef.set(updatedUser);
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    respondWithFirestoreError(res, error, OperationType.WRITE, `users/${userEmail}`, userEmail);
  }
});

// DELETE /api/users/me
router.delete('/me', requireAuth, async (req, res) => {
  const userEmail = req.userEmail as string;
  try {
    const userRef = db.collection('users').doc(userEmail);
    await userRef.delete();
    res.json({ success: true });
  } catch (error) {
    respondWithFirestoreError(res, error, OperationType.DELETE, `users/${userEmail}`, userEmail);
  }
});

export default router;
