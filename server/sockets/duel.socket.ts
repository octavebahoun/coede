import { Server, Socket } from 'socket.io';
import { Duel } from '../models/Duel';

export function setupDuelSockets(io: Server) {
    const duelNamespace = io.of('/duels');

    duelNamespace.on('connection', (socket: Socket) => {
        console.log(`[Socket] Nouvelle connexion duel: ${socket.id}`);

        socket.on('duel:join', async ({ roomId, userId }) => {
            socket.join(roomId);
            console.log(`[Socket] Utilisateur ${userId} a rejoint la salle ${roomId}`);

            // Prévenir l'autre joueur
            socket.to(roomId).emit('duel:player_joined', { userId });
        });

        socket.on('duel:ready', ({ roomId, userId }) => {
            // Logique simplifiée : si un prêt, on l'annonce
            // Idéalement, il faudrait stocker l'état 'ready' pour les deux joueurs dans une Map() en RAM
            duelNamespace.to(roomId).emit('duel:opponent_ready', { userId });
        });

        socket.on('duel:start', ({ roomId }) => {
            console.log(`[Socket] Démarrage du duel ${roomId}`);
            duelNamespace.to(roomId).emit('duel:start');

            // Lancer le timer (ex: 15 minutes = 900 secondes)
            let timeLeft = 900;
            const timer = setInterval(() => {
                timeLeft -= 1;
                duelNamespace.to(roomId).emit('duel:tick', { timeLeft });

                if (timeLeft <= 0) {
                    clearInterval(timer);
                    duelNamespace.to(roomId).emit('duel:time_up');
                }
            }, 1000);
        });

        socket.on('duel:submit', async ({ roomId, userId, code, score }) => {
            console.log(`[Socket] Soumission dans ${roomId} par ${userId}`);

            // Broadcast que l'adversaire a soumis
            socket.to(roomId).emit('duel:opponent_submitted', { userId });

            // Évaluation finale si les deux ont soumis (simplifié ici)
            duelNamespace.to(roomId).emit('duel:result', {
                playerScore: score,
                userId
            });
        });

        socket.on('duel:leave', ({ roomId, userId }) => {
            socket.leave(roomId);
            socket.to(roomId).emit('duel:opponent_left', { userId });
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Déconnexion duel: ${socket.id}`);
        });
    });
}
