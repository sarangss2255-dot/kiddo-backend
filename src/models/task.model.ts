import { Schema, model } from 'mongoose';

const taskSchema = new Schema(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'General' },
    points: { type: Number, required: true, min: 0 },
    rewardUnlockThreshold: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed', 'approved'],
      default: 'todo',
    },
    dueDate: { type: Date },
    completedAt: { type: Date },
    approvedAt: { type: Date },
  },
  { timestamps: true },
);

export const Task = model('Task', taskSchema);
