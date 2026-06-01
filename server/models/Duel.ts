import mongoose, { Document, Schema } from 'mongoose';

export interface IDuel extends Document {
  roomId: string;
  player1: mongoose.Types.ObjectId;
  player2?: mongoose.Types.ObjectId;
  challengeId?: mongoose.Types.ObjectId;
  status: 'waiting' | 'ongoing' | 'finished';
  winner?: mongoose.Types.ObjectId;
  player1Score: number;
  player2Score: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
}

const duelSchema = new Schema<IDuel>({
  roomId: { type: String, required: true, unique: true },
  player1: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  player2: { type: Schema.Types.ObjectId, ref: 'User' },
  challengeId: { type: Schema.Types.ObjectId, ref: 'Challenge' },
  status: { type: String, enum: ['waiting', 'ongoing', 'finished'], default: 'waiting' },
  winner: { type: Schema.Types.ObjectId, ref: 'User' },
  player1Score: { type: Number, default: 0 },
  player2Score: { type: Number, default: 0 },
  startedAt: { type: Date },
  endedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export const Duel = mongoose.model<IDuel>('Duel', duelSchema);
