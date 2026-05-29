import { Issue } from '../models/issue.model.js';

export async function createIssue(
  userId: string,
  input: {
    category: string;
    description: string;
    deviceInfo?: string;
    appVersion?: string;
  },
) {
  return Issue.create({
    userId,
    ...input,
  });
}

export async function getIssuesByUser(userId: string) {
  return Issue.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

export async function getAllIssues() {
  return Issue.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('userId', 'firstName lastName email role');
}
