require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { default: logger } = require('../utils/logger');
const { hashPassword, comparePassword } = require('../utils/hash');
const { UniqueConstraintError, ValidationError } = require('sequelize');
const { registerSchema, loginSchema } = require('../schemas/authSchemas');

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Input Validation using Joi
    const { error } = registerSchema.validate(req.body);
    if (error) {
      logger.warn(`Validation error during registration: ${error.details[0].message}`);
      return res.status(400).json({
        message: 'Registration failed due to invalid input',
        error: error.details[0].message
      });
    }

    // 2. Hash Password
    const hashedPassword = await hashPassword(password);

    // 3. Create User
    const user = await User.create({ email, password: hashedPassword });

    // 4. Log Success
    logger.info(`New user registered successfully: ${user.email} (ID: ${user.id})`);

    // 5. Send Success Response
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    // 6. Error Handling
    if (err instanceof UniqueConstraintError) {
      logger.warn(`Registration failed: Email already registered for ${req.body.email}`);
      return res.status(409).json({
        message: 'Registration failed',
        error: 'Email already registered.'
      });
    } else if (err instanceof ValidationError) {
      logger.error(`Sequelize validation error during registration: ${err.message}`);
      return res.status(400).json({
        message: 'Registration failed due to invalid data',
        error: err.message
      });
    }
    logger.error(`An unexpected error occurred during registration for ${req.body.email}: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Input Validation using Joi
    const { error } = loginSchema.validate(req.body);
    if (error) {
      logger.warn(`Validation error during login: ${error.details[0].message}`);
      return res.status(400).json({
        message: 'Login failed due to invalid input',
        error: error.details[0].message
      });
    }

    // 2. Find User
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn(`Login attempt for non-existent email: ${email}`);
      return res.status(401).json({
        message: 'Invalid credentials',
        error: 'Email or password is incorrect'
      });
    }

    // 3. Compare Passwords
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      logger.warn(`Failed login attempt for user: ${email}`);
      return res.status(401).json({
        message: 'Invalid credentials',
        error: 'Email or password is incorrect'
      });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRATION || '1d',
        issuer: process.env.JWT_ISSUER || 'NotaKita'
      }
    );

    // 5. Set HttpOnly cookie for better security (optional)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'strict'
    });

    // 6. Log success
    logger.info(`User logged in successfully: ${email}`);

    // 7. Send response (without token in body if using cookies)
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email
      },
      ...(!req.cookies.token && { token }) // Only send token in body if not using cookies
    });
  } catch (err) {
    logger.error(`Login error for ${req.body.email}: ${err.message}`, { stack: err.stack });
    next(err); // Pass to centralized error handler
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optionally: fetch full user info from DB
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email'] // don't expose password
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    logger.warn(`Token verification failed: ${err.message}`);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.logout = (req, res) => {
  // Clear the cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  // Send response
  res.json({ message: 'Logged out successfully' });
};