import { Router } from 'express';
import passport from 'passport';

const router = Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', {
  successRedirect: CLIENT_URL,
  failureRedirect: `${CLIENT_URL}/login?error=auth_failed`
}));

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', passport.authenticate('github', {
  successRedirect: CLIENT_URL,
  failureRedirect: `${CLIENT_URL}/login?error=auth_failed`
}));

// Récupérer la session courante
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: 'Non authentifié' });
  }
});

// Déconnexion
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy((err) => {
        if(err) console.error("Erreur destruction session", err);
        res.json({ message: 'Déconnecté' });
    });
  });
});

export default router;
