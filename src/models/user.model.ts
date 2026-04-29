import { Schema, model } from 'mongoose';
import { ROLES } from '../constants/roles.js';

const userSchema = new Schema(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family' },
    parentId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: Object.values(ROLES), required: true },
    email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
    username: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
    passwordHash: { type: String },
    childLoginCode: { type: String, trim: true, uppercase: true, sparse: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: '' },
    avatar: { type: String, default: 'rocket-kid' },
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    chessWins: { type: Number, default: 0 },
    chessGamesPlayed: { type: Number, default: 0 },
    lastChessRewardAt: { type: Date },
    memoryWins: { type: Number, default: 0 },
    memoryGamesPlayed: { type: Number, default: 0 },
    lastMemoryRewardAt: { type: Date },
    mathWins: { type: Number, default: 0 },
    mathGamesPlayed: { type: Number, default: 0 },
    lastMathRewardAt: { type: Date },
    patternWins: { type: Number, default: 0 },
    patternGamesPlayed: { type: Number, default: 0 },
    lastPatternRewardAt: { type: Date },
    lastCompletedAt: { type: Date },
    notificationToken: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = model('User', userSchema);
