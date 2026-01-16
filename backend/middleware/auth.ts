import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User,{IUser} from '../models/User'

// Define a custom Request type that includes "user"
export interface AuthRequest extends Request {
  user?: any;
}

// Middleware function
const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    // Assuming your JWT contains { id: string }
    req.user = await User.findById(decoded.id).select('-passwordHash');

    if (!req.user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

export default auth;
