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
