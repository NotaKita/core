// middlewares/authMiddleware.js
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  let token;

  // 1. Get the token from the cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. If no token found, return 403
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  // 3. Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the database to ensure they still exist and are not deactivated
    const user = await User.findByPk(decoded.id); // Assuming decoded.id is the user's UUID or INTEGER ID

    if (!user) {
      // User was deleted or doesn't exist anymore
      console.warn(`Attempt to use token for non-existent user ID: ${decoded.id}`);
      return res.status(401).json({ message: 'User not found or account deactivated.' });
    }

    req.user = decoded; // Attach decoded token payload (e.g., id, email)
    req.currentUser = user; // Optionally attach the full user object from DB (useful for roles, etc.)
    next();
  } catch (err) {
    // console.error('Token verification failed:', err.message); // For debugging
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};