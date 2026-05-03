import { User } from '../models/user.model.js';

export async function getLeaderboard(familyId: string, school?: string) {
  const query: any = { role: 'child' };
  if (familyId) query.familyId = familyId;
  if (school) query.school = school;

  return User.find(query)
    .select('firstName lastName avatar points streak school')
    .sort({ points: -1, streak: -1 })
    .limit(50)
    .lean();
}

export async function getGlobalLeaderboard() {
  return User.find({ role: 'child' })
    .select('firstName lastName avatar points streak school')
    .sort({ points: -1, streak: -1 })
    .limit(100)
    .lean();
}

export async function getSchoolLeaderboard(schoolName: string) {
  return User.find({ role: 'child', school: schoolName })
    .select('firstName lastName avatar points streak school')
    .sort({ points: -1, streak: -1 })
    .limit(100)
    .lean();
}
