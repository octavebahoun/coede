import { Request, Response } from 'express';
import { Duel } from '../models/Duel';

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const createDuel = async (req: Request, res: Response) => {
    try {
        const player1Id = (req.user as any)._id;
        const roomId = generateRoomId();

        const duel = await Duel.create({
            roomId,
            player1: player1Id,
            status: 'waiting'
        });

        res.json(duel);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const joinDuel = async (req: Request, res: Response) => {
    const { roomId } = req.body;
    try {
        const player2Id = (req.user as any)._id;
        const duel = await Duel.findOne({ roomId });

        if (!duel) return res.status(404).json({ error: "Salle introuvable" });
        if (duel.status !== 'waiting') return res.status(400).json({ error: "La salle n'est plus en attente" });
        if (duel.player1.toString() === player2Id.toString()) return res.status(400).json({ error: "Vous êtes déjà dans cette salle" });

        duel.player2 = player2Id;
        duel.status = 'ongoing';
        duel.startedAt = new Date();
        await duel.save();

        res.json(duel);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getDuelState = async (req: Request, res: Response) => {
    try {
        const duel = await Duel.findOne({ roomId: req.params.roomId })
            .populate('player1', 'username avatar level')
            .populate('player2', 'username avatar level')
            .populate('challengeId');
        if (!duel) return res.status(404).json({ error: "Salle introuvable" });
        res.json(duel);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getDuelHistory = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any)._id;
        const duels = await Duel.find({ $or: [{ player1: userId }, { player2: userId }] })
            .populate('player1', 'username')
            .populate('player2', 'username')
            .sort({ createdAt: -1 });
        res.json(duels);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};