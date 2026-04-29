import { StatusCodes } from 'http-status-codes';
import { Activity } from '../models/activity.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

const CHESS_REWARD_POINTS = 15;
const CHESS_REWARD_COOLDOWN_MS = 1000 * 60 * 60 * 6;
const MEMORY_REWARD_POINTS = 10;
const MATH_REWARD_POINTS = 12;
const PATTERN_REWARD_POINTS = 11;
const PUZZLE_REWARD_POINTS = 9;
const EXTRA_GAME_COOLDOWN_MS = 1000 * 60 * 60 * 3;

export async function rewardChessWin(userId: string, familyId: string | undefined, moves?: number) {
  const user = await User.findOne({ _id: userId, familyId, role: 'child' });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child user not found');
  }

  const now = new Date();
  const lastRewardAt = user.lastChessRewardAt ? new Date(user.lastChessRewardAt).getTime() : 0;
  const cooldownActive = lastRewardAt > 0 && now.getTime() - lastRewardAt < CHESS_REWARD_COOLDOWN_MS;

  user.chessGamesPlayed = (user.chessGamesPlayed ?? 0) + 1;
  user.chessWins = (user.chessWins ?? 0) + 1;

  if (!cooldownActive) {
    user.points = (user.points ?? 0) + CHESS_REWARD_POINTS;
    user.lastChessRewardAt = now;
  }

  await user.save();
  await Activity.create({
    familyId,
    actorId: userId,
    type: 'game_reward_claimed',
    message: `${user.firstName} logged a chess win`,
    metadata: { game: 'chess', awarded: !cooldownActive, pointsAwarded: cooldownActive ? 0 : CHESS_REWARD_POINTS },
  });

  return {
    awarded: !cooldownActive,
    pointsAwarded: cooldownActive ? 0 : CHESS_REWARD_POINTS,
    totalPoints: user.points,
    cooldownEndsAt: cooldownActive ? new Date(lastRewardAt + CHESS_REWARD_COOLDOWN_MS).toISOString() : null,
    moves: typeof moves === 'number' ? moves : null,
    stats: {
      chessWins: user.chessWins,
      chessGamesPlayed: user.chessGamesPlayed,
    },
  };
}

type ExtraGameType = 'memory' | 'math' | 'pattern' | 'puzzle';

const extraGameConfig: Record<ExtraGameType, {
  points: number;
  winsKey: 'memoryWins' | 'mathWins' | 'patternWins' | 'puzzleWins';
  playedKey: 'memoryGamesPlayed' | 'mathGamesPlayed' | 'patternGamesPlayed' | 'puzzleGamesPlayed';
  cooldownKey: 'lastMemoryRewardAt' | 'lastMathRewardAt' | 'lastPatternRewardAt' | 'lastPuzzleRewardAt';
  label: string;
}> = {
  memory: {
    points: MEMORY_REWARD_POINTS,
    winsKey: 'memoryWins',
    playedKey: 'memoryGamesPlayed',
    cooldownKey: 'lastMemoryRewardAt',
    label: 'Memory Match',
  },
  math: {
    points: MATH_REWARD_POINTS,
    winsKey: 'mathWins',
    playedKey: 'mathGamesPlayed',
    cooldownKey: 'lastMathRewardAt',
    label: 'Math Blitz',
  },
  pattern: {
    points: PATTERN_REWARD_POINTS,
    winsKey: 'patternWins',
    playedKey: 'patternGamesPlayed',
    cooldownKey: 'lastPatternRewardAt',
    label: 'Pattern Tap',
  },
  puzzle: {
    points: PUZZLE_REWARD_POINTS,
    winsKey: 'puzzleWins',
    playedKey: 'puzzleGamesPlayed',
    cooldownKey: 'lastPuzzleRewardAt',
    label: 'Jigsaw Puzzle',
  },
};

export async function rewardExtraGameWin(
  userId: string,
  familyId: string | undefined,
  game: ExtraGameType,
  score?: number,
  moves?: number,
) {
  const user = await User.findOne({ _id: userId, familyId, role: 'child' });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child user not found');
  }

  const config = extraGameConfig[game];
  const now = new Date();
  const lastRewardAt = user[config.cooldownKey] ? new Date(user[config.cooldownKey] as Date).getTime() : 0;
  const cooldownActive = lastRewardAt > 0 && now.getTime() - lastRewardAt < EXTRA_GAME_COOLDOWN_MS;

  user[config.playedKey] = ((user[config.playedKey] as number | undefined) ?? 0) + 1;
  user[config.winsKey] = ((user[config.winsKey] as number | undefined) ?? 0) + 1;

  if (!cooldownActive) {
    user.points = (user.points ?? 0) + config.points;
    user[config.cooldownKey] = now;
  }

  await user.save();
  await Activity.create({
    familyId,
    actorId: userId,
    type: 'game_reward_claimed',
    message: `${user.firstName} completed ${config.label}`,
    metadata: {
      game,
      awarded: !cooldownActive,
      pointsAwarded: cooldownActive ? 0 : config.points,
      score: typeof score === 'number' ? score : null,
      moves: typeof moves === 'number' ? moves : null,
    },
  });

  return {
    awarded: !cooldownActive,
    pointsAwarded: cooldownActive ? 0 : config.points,
    totalPoints: user.points,
    cooldownEndsAt: cooldownActive ? new Date(lastRewardAt + EXTRA_GAME_COOLDOWN_MS).toISOString() : null,
    game,
    score: typeof score === 'number' ? score : null,
    moves: typeof moves === 'number' ? moves : null,
    stats: {
      wins: user[config.winsKey],
      gamesPlayed: user[config.playedKey],
    },
  };
}
