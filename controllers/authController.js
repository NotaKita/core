const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../utils/hash');
const { user: User } = require('../models');
require('dotenv').config();

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashed = await hashPassword(password);

    const user = await User.create({ email, password: String(hashed) });
    console.log('user', user);
    res.status(201).json({ message: 'User registered', user: { id: user.id, email } });
  } catch (err) {
    res.status(500).json({ message: 'Register error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};
