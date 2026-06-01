export interface Challenge {
  id: string;
  title: string;
  description: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  language: string[];
  duration: number; // in minutes or seconds
  difficulty: 'Extrême' | 'Hard' | 'Medium' | 'Easy';
  avgVelocity?: string;
  successRate?: string;
  fidelity?: string;
  statsType: 'velocity' | 'success' | 'fidelity';
  initialFiles: Record<string, string>;
  testOutputMocked?: string;
}

export interface Project {
  id: string;
  name: string;
  language: string;
  description: string;
  modifiedAt: string;
  files: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  sender: 'GuillaumeD' | 'Coach' | 'System' | 'Adversaire';
  text: string;
  timestamp: string;
}

export interface DuelRoom {
  id: string;
  roomId: string;
  status: 'searching' | 'waiting' | 'ready' | 'coding' | 'finished';
  opponentName?: string;
  opponentAvatar?: string;
  opponentRank?: string;
  opponentLanguages?: string[];
  opponentStatus?: 'Recherche...' | 'Prêt' | 'En train de coder...' | 'Soumis';
  logs: string[];
  messages: ChatMessage[];
  challenge?: Challenge;
}

export interface UserStats {
  level: number;
  totalScore: number;
  challengesDone: number;
  wins: number;
  losses: number;
  recentScores: number[]; // For Recharts line charts
}
