import { User } from '../models/user.model.js';

export const LEVEL_TITLES = [
  { level: 1, title: 'Rookie' },
  { level: 5, title: 'Scout' },
  { level: 10, title: 'Explorer' },
  { level: 15, title: 'Commander' },
  { level: 20, title: 'Legend' },
  { level: 25, title: 'Mythic' },
];

export function getLevelTitle(level: number): string {
  let title = LEVEL_TITLES[0].title;
  for (const threshold of LEVEL_TITLES) {
    if (level >= threshold.level) {
      title = threshold.title;
    } else {
      break;
    }
  }
  return title;
}

export function getNextLevelXP(level: number): number {
  // Formula: level * level * 100
  return level * level * 100;
}

export async function processLevelUp(userId: string) {
  const user = await User.findById(userId);
  if (!user) return null;

  let leveledUp = false;
  let xpNeeded = getNextLevelXP(user.level);

  while (user.xp >= xpNeeded) {
    user.level += 1;
    leveledUp = true;
    xpNeeded = getNextLevelXP(user.level);
  }

  if (leveledUp) {
    await user.save();
  }

  return {
    leveledUp,
    currentLevel: user.level,
    title: getLevelTitle(user.level),
    nextLevelXP: xpNeeded,
  };
}
