import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  role: 'parent' | 'kid' | 'admin';
  familyId: string;
  points: number;
  chessWins: number;
  chessGamesPlayed: number;
  lastChessRewardAt?: Date;
  displayName: string;
  avatar?: string;
  createdAt: Date;
}

const UserSchema = new Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['parent', 'kid', 'admin'], default: 'kid' },
  familyId: { type: String, required: true },
  points: { type: Number, default: 0 },
  chessWins: { type: Number, default: 0 },
  chessGamesPlayed: { type: Number, default: 0 },
  lastChessRewardAt: { type: Date },
  displayName: { type: String, required: true },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', UserSchema);

export interface IFamily extends Document {
  name: string;
  adminId: string; // firebaseUid of the parent who created it
  createdAt: Date;
}

const FamilySchema = new Schema({
  name: { type: String, required: true },
  adminId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Family = mongoose.model<IFamily>('Family', FamilySchema);

export interface ITask extends Document {
  title: string;
  description?: string;
  points: number;
  assignedTo: string; // firebaseUid
  createdBy: string; // firebaseUid
  familyId: string;
  status: 'pending' | 'completed' | 'approved';
  category?: string;
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  approvedAt?: Date;
}

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  points: { type: Number, required: true },
  assignedTo: { type: String, required: true },
  createdBy: { type: String, required: true },
  familyId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'approved'], default: 'pending' },
  category: { type: String },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  approvedAt: { type: Date }
});

export const Task = mongoose.model<ITask>('Task', TaskSchema);
