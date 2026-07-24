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

// GET /api/auth/linkedin - redirects the browser to LinkedIn's authorization page.
// LinkedIn (unlike Google) has no client-side button that hands back a token directly —
// this is a full-page redirect flow: leave our site, approve on LinkedIn, come back with a code.
router.get('/linkedin', (req, res) => {
  if (!process.env.LINKEDIN_CLIENT_ID) {
    return res.status(500).send('LinkedIn login is not configured on this server (missing LINKEDIN_CLIENT_ID).');
  }
  const role = req.query.role === 'recruiter' ? 'recruiter' : 'candidate';
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/linkedin/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    state: role, // stash the intended role through the round trip
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
});

// GET /api/auth/linkedin/callback - LinkedIn redirects here with a ?code=...
// Exchange the code for an access token, fetch the user's profile, find/create the
// user, issue our own JWT, then redirect back to the frontend with that JWT in the URL
// (the frontend's OAuthCallback page picks it up and stores it).
router.get('/linkedin/callback', async (req, res) => {
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=linkedin_no_code`);
    }
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/linkedin/callback`;

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('LinkedIn token exchange failed:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=linkedin_token_exchange`);
    }

    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.email) {
      return res.redirect(`${frontendUrl}/login?error=linkedin_no_email`);
    }

    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const role = state === 'recruiter' ? 'recruiter' : 'candidate';
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        password: randomPassword,
        authProvider: 'linkedin',
        avatarUrl: profile.picture || '',
        role,
      });
    }

    const jwtToken = signToken(user);
    res.redirect(`${frontendUrl}/oauth/callback?token=${jwtToken}`);
  } catch (err) {
    console.error('LinkedIn callback error:', err);
    res.redirect(`${frontendUrl}/login?error=linkedin_failed`);
  }
});

module.exports = router;