import { Schema, model } from 'mongoose';
import { ROLES } from '../constants/roles.js';

const teacherSchema = new Schema(
  {
    teacherCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, trim: true, default: '' },
    schoolName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'active', 'disabled'], default: 'pending' },
    role: { type: String, default: ROLES.TEACHER },
    passwordHash: { type: String, default: '' },
    totalStudents: { type: Number, default: 0 },
    totalClasses: { type: Number, default: 0 },
    totalTasksCreated: { type: Number, default: 0 },
    createdByAdmin: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const Teacher = model('Teacher', teacherSchema);