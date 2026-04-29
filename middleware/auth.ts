import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { User } from '../models';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role: string;
    familyId: string;
    mongoId: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Fetch user from MongoDB
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // If user doesn't exist in MongoDB yet, we might want to handle registration elsewhere
    // but for now, we'll just block if not found unless it's a registration route
    if (!user && !req.path.endsWith('/register')) {
      return res.status(401).json({ error: 'User profile not found in MongoDB' });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: user?.role || 'kid',
      familyId: user?.familyId || '',
      mongoId: user?._id ? String(user._id) : ''
    };
    
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied: Requires one of [${roles.join(', ')}] roles` });
    }
    next();
  };
};

export const authenticateAdmin = [
  authenticate,
  requireRole(['admin'])
];
