const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const interviewRoutes = require('./routes/interviews');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Render (and most PaaS hosts) sit the app behind a reverse proxy that terminates
// SSL — without this, Express's req.protocol always reports "http" even when the
// real request came in over https, which breaks anything building an absolute URL
// from req.protocol (like the LinkedIn OAuth redirect_uri in routes/auth.js).
app.set('trust proxy', 1);

// In production, set CORS_ORIGIN to your deployed frontend's URL (e.g. https://your-app.onrender.com).
// Left unset, CORS allows all origins — fine for local dev, not recommended once deployed.
const corsOptions = process.env.CORS_ORIGIN
  ? { origin: process.env.CORS_ORIGIN }
  : {};
app.use(cors(corsOptions));
app.use(express.json({ limit: '3mb' })); // raised from default 100kb to allow base64 avatar uploads

// Basic brute-force protection on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many auth requests, please try again later' },
});
app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;