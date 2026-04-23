require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    // 1. Extract token from cookies
    const token = req.cookies?.token;

    // 2. If no token, deny access
    if (!token) {
      return res.status(403).json({ message: 'No token provided' });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find user from database
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email'] // Only what’s needed, avoid exposing password
    });

    if (!user) {
      console.warn(`Attempt to use token for non-existent user ID: ${decoded.id}`);
      return res.status(401).json({ message: 'User not found or account deactivated.' });
    }

    // 5. Attach to request
    req.user = decoded;      // Token payload
    req.currentUser = user;  // Full DB user
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(401).json({ message: 'Invalid token' });
  }
};
