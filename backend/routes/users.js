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
      'country', 'city', 'timezone', 'workAuthorization',
      'availability', 'workPreferences', 'communicationPrefs',
      'companyName', 'companyWebsite', 'positionAtCompany',
      'department', 'companySize', 'industry',
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

// PUT /api/users/change-password - change the current user's password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user._id);
    const matches = await user.comparePassword(currentPassword);
    if (!matches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;