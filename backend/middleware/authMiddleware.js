import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').find((item) => item.trim().startsWith('jwt='));
  if (!cookie) return null;

  return decodeURIComponent(cookie.trim().split('=')[1]);
};

const protect = async (req, res, next) => {
  let token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-tokens');

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

export default protect;
