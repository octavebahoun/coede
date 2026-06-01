import { Request, Response } from 'express';
import { User } from '../models/User';

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select('-email'); // Cacher email public
        if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateMe = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any)._id;
        const updates = req.body;
        // Restreindre les champs modifiables
        const allowedUpdates = {
            username: updates.username,
            preferences: updates.preferences
        };
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: allowedUpdates }, { new: true });
        res.json(updatedUser);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const topUsers = await User.find().sort({ totalScore: -1 }).limit(100).select('username avatar level totalScore wins');
        res.json(topUsers);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteMe = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any)._id;
        await User.findByIdAndDelete(userId);
        req.logout((err) => {
           if(err) return res.status(500).json({ error: "Erreur déconnexion" });
           req.session.destroy(() => res.json({ message: "Compte supprimé" }));
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};