import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  oauthId: string;
  provider: 'google' | 'github';
  username: string;
  email: string;
  avatar?: string;
  level: number;
  totalScore: number;
  challengesDone: number;
  wins: number;
  losses: number;
  createdAt: Date;
  lastLogin: Date;
  preferences: {
    theme: string;
    aiModel: string;
  };
}

const userSchema = new Schema<IUser>({
  oauthId: { type: String, required: true },
  provider: { type: String, enum: ['google', 'github'], required: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  level: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  challengesDone: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  preferences: {
    theme: { type: String, default: 'dark' },
    aiModel: { type: String, default: 'gemini-3.5-flash' },
  }
});

// Index to ensure oauthId + provider is unique
userSchema.index({ oauthId: 1, provider: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', userSchema);
