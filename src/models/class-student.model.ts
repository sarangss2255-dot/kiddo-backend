import { Schema, model } from 'mongoose';

const classStudentSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'removed'], default: 'active' },
  },
  { timestamps: true },
);

classStudentSchema.index({ classId: 1, childId: 1 }, { unique: true });

export const ClassStudent = model('ClassStudent', classStudentSchema);