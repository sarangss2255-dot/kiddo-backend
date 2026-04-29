import { User } from '../models/user.model.js';

export async function getLeaderboard(familyId: string) {
  return User.find({ familyId, role: 'child' })
    .select('firstName lastName avatar points streak')
    .sort({ points: -1, streak: -1 })
    .lean();
}
