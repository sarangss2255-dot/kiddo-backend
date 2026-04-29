import { Request, Response } from 'express';
import { User, Task, Family } from '../models';
import { AuthRequest } from '../middleware/auth';

const CHESS_REWARD_POINTS = 15;
const CHESS_REWARD_COOLDOWN_MS = 1000 * 60 * 60 * 6;

// User Profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user?.uid });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const getKids = async (req: AuthRequest, res: Response) => {
  try {
    const kids = await User.find({ familyId: req.user?.familyId, role: 'kid' });
    res.json(kids);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch kids' });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  const { firebaseUid, email, displayName, role, familyName } = req.body;
  try {
    let user = await User.findOne({ firebaseUid });
    if (user) return res.status(400).json({ error: 'User already registered' });

    let familyId = 'default-family';
    if (role === 'parent' && familyName) {
      const family = await Family.create({
        name: familyName,
        adminId: firebaseUid
      });
      familyId = String(family._id);
    }

    user = await User.create({
      firebaseUid,
      email,
      displayName,
      role,
      familyId
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Tasks
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await Task.find({ familyId: req.user?.familyId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user?.uid,
      familyId: req.user?.familyId,
      status: 'pending'
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const task = await Task.findOneAndUpdate(
      { _id: id, familyId: req.user?.familyId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const approveTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const task = await Task.findOne({ _id: id, familyId: req.user?.familyId });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = 'approved';
    task.approvedAt = new Date();
    await task.save();

    // Reward points to the kid
    await User.findOneAndUpdate(
      { firebaseUid: task.assignedTo },
      { $inc: { points: task.points } }
    );

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Approval failed' });
  }
};

export const rewardChessWin = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'kid') {
      return res.status(403).json({ error: 'Only kids can claim chess rewards' });
    }

    const { outcome, moves } = req.body ?? {};
    if (outcome !== 'win') {
      return res.status(400).json({ error: 'Only winning games are rewardable' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid, familyId: req.user.familyId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const lastRewardTime = user.lastChessRewardAt ? new Date(user.lastChessRewardAt).getTime() : 0;
    const isCooldownActive = lastRewardTime > 0 && now.getTime() - lastRewardTime < CHESS_REWARD_COOLDOWN_MS;

    user.chessGamesPlayed = (user.chessGamesPlayed || 0) + 1;
    user.chessWins = (user.chessWins || 0) + 1;

    if (!isCooldownActive) {
      user.points = (user.points || 0) + CHESS_REWARD_POINTS;
      user.lastChessRewardAt = now;
    }

    await user.save();

    return res.json({
      awarded: !isCooldownActive,
      pointsAwarded: !isCooldownActive ? CHESS_REWARD_POINTS : 0,
      totalPoints: user.points,
      stats: {
        chessWins: user.chessWins,
        chessGamesPlayed: user.chessGamesPlayed,
      },
      cooldownEndsAt: isCooldownActive
        ? new Date(lastRewardTime + CHESS_REWARD_COOLDOWN_MS).toISOString()
        : null,
      moves: typeof moves === 'number' ? moves : null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reward chess win' });
  }
};
