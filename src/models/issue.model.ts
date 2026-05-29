import { Schema, model } from 'mongoose';

const issueSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['bug', 'feedback', 'account', 'other'],
      required: true,
    },
    description: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    deviceInfo: { type: String, default: '' },
    appVersion: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Issue = model('Issue', issueSchema);
