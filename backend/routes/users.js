const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile - current user's full profile
router.get('/profile', protect, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/users/profile - update candidate profile fields
router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = [
      'name', 'title', 'bio', 'skills', 'hourlyRate', 'resumeUrl',
      'phone', 'linkedinUrl', 'summary',
      'education', 'workExperience', 'projects',
      'publications', 'certifications', 'awards',
      'profiles', 'portfolioUrl', 'otherLinks',
      'languages', 'hobbies',
    ];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
