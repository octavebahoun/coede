import mongoose, { Document, Schema } from 'mongoose';

export interface IChallenge extends Document {
  userId: mongoose.Types.ObjectId | null;
  title: string;
  description: string;
  level: string;
  subLevel: number;
  language: string;
  duration: number;
  codeSubmitted?: string;
  score?: number;
  feedback?: any;
  eslintErrors?: any[];
  timeUsed?: number;
  status: 'pending' | 'completed' | 'timeout';
  createdAt: Date;
}

const challengeSchema = new Schema<IChallenge>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // Null for guest sessions
  title: { type: String, required: true },
  description: { type: String, required: true },
  level: { type: String, required: true },
  subLevel: { type: Number, default: 1 },
  language: { type: String, required: true },
  duration: { type: Number, required: true },
  codeSubmitted: { type: String },
  score: { type: Number },
  feedback: { type: Schema.Types.Mixed },
  eslintErrors: [{ type: Schema.Types.Mixed }],
  timeUsed: { type: Number },
  status: { type: String, enum: ['pending', 'completed', 'timeout'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export const Challenge = mongoose.model<IChallenge>('Challenge', challengeSchema);
