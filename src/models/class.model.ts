import { Schema, model } from 'mongoose';

const classSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    className: { type: String, required: true, trim: true },
    grade: { type: Number, required: true, min: 1, max: 12 },
    classCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, trim: true, default: '' },
    totalStudents: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Class = model('Class', classSchema);