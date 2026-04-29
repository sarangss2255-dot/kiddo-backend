import { Request, Response } from 'express';
import { db, auth } from '../config/firebase';

export const getStats = async (req: Request, res: Response) => {
  try {
    const usersSnap = await db.collection('users').count().get();
    const familiesSnap = await db.collection('families').count().get();
    const tasksSnap = await db.collection('tasks').count().get();

    res.json({
      totalUsers: usersSnap.data().count,
      totalFamilies: familiesSnap.data().count,
      totalTasks: tasksSnap.data().count,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const usersSnap = await db.collection('users').orderBy('createdAt', 'desc').limit(50).get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const setRole = async (req: Request, res: Response) => {
  const { uid, role } = req.body;
  if (!uid || !['admin', 'parent', 'kid'].includes(role)) {
    return res.status(400).json({ error: 'Valid uid and role are required' });
  }

  try {
    await db.collection('users').doc(uid).update({ role });
    await auth.setCustomUserClaims(uid, { role });
    res.json({ success: true, message: `Role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

export const broadcast = async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  
  console.log(`[SYSTEM BROADCAST]: ${message}`);
  res.json({ success: true, message: 'Broadcast queued locally' });
};
