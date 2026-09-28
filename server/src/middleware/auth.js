import User from '../models/User.js';
import { verifyToken } from '../utils/generateToken.js';

/**
 * Middleware to protect routes by validating JWT token
 */
export const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';

  // Extract token from "Authorization: Bearer <token>"
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let decoded;
  try {
    decoded = verifyToken(header.split(' ')[1]);
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  try {
    // Password is excluded by default (select: false in the schema)
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    next();
  } catch (error) {
    next(error);
  }
};
