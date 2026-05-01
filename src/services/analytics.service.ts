import { Activity } from '../models/activity.model.js';
import { Family } from '../models/family.model.js';
import { Task } from '../models/task.model.js';
import { User } from '../models/user.model.js';

export async function getAdminAnalytics() {
  const [parents, children, families, tasks, completedToday, activity] = await Promise.all([
    User.countDocuments({ role: 'parent' }),
    User.countDocuments({ role: 'child' }),
    Family.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({
      completedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    }),
    Activity.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return {
    totals: {
      parents,
      children,
      families,
      tasks,
      completedToday,
    },
    recentActivity: activity,
  };
}

export async function getFamilyAnalytics(familyId: string) {
  const [users, tasks, recentActivity] = await Promise.all([
    User.find({ familyId }).select('firstName role points xp level skillXP').lean(),
    Task.find({ familyId }).lean(),
    Activity.find({ familyId }).sort({ createdAt: -1 }).limit(15).lean(),
  ]);

  const children = users.filter(u => u.role === 'child');
  const completedTasks = tasks.filter(t => t.status === 'approved' || t.status === 'completed');
  
  // Category distribution
  const categories: Record<string, number> = {};
  tasks.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + 1;
  });

  // Completion rate
  const completionRate = tasks.length > 0 
    ? (completedTasks.length / tasks.length) * 100 
    : 0;

  return {
    summary: {
      totalChildren: children.length,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate: Math.round(completionRate),
    },
    children: children.map(c => ({
      id: (c as any)._id,
      name: c.firstName,
      level: c.level,
      points: c.points,
      xp: c.xp,
      skills: c.skillXP,
    })),
    categories,
    recentActivity,
  };
}
