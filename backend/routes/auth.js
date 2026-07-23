const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { isValidEmail, isValidPassword } = require('../utils/validators');

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (role && !['candidate', 'recruiter'].includes(role)) {
      return res.status(400).json({ message: 'Role must be candidate or recruiter' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({
      name: name.trim(),
      email,
      password,
      role: role === 'recruiter' ? 'recruiter' : 'candidate',
    });

    res.status(201).json({ token: signToken(user), user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user), user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/google - verifies a Google ID token, finds or creates the user, issues our own JWT.
// Uses Google Identity Services (frontend renders the button, sends back an ID token) —
// no client secret needed, since we're only verifying a token, not exchanging an auth code.
router.post('/google', async (req, res, next) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ message: 'Google login is not configured on this server (missing GOOGLE_CLIENT_ID).' });
    }
    const { credential, role } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).json({ message: 'Could not verify Google account' });
    }

    let user = await User.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      // First time logging in with this Google account — create a new account.
      // Password is required by the schema but never used for Google accounts,
      // so generate a long random one that nobody will ever type.
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        password: randomPassword,
        authProvider: 'google',
        avatarUrl: payload.picture || '',
        role: role === 'recruiter' ? 'recruiter' : 'candidate',
      });
    }

    res.json({ token: signToken(user), user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;