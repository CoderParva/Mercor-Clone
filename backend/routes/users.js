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
    if (typeof req.body.avatarUrl === 'string' && req.body.avatarUrl.length > 2_800_000) {
      return res.status(400).json({ message: 'Image is too large — please use a smaller file (under ~2MB).' });
    }

    const allowed = [
      'name', 'title', 'bio', 'skills', 'hourlyRate', 'resumeUrl',
      'phone', 'linkedinUrl', 'summary',
      'education', 'workExperience', 'projects',
      'publications', 'certifications', 'awards',
      'profiles', 'portfolioUrl', 'otherLinks',
      'languages', 'hobbies',
      'country', 'state', 'city', 'postalCode', 'timezone', 'workAuthorization',
      'dateOfBirth', 'workingFromDifferentCountry', 'legalAttestation',
      'availability', 'workingHours', 'dateExceptions',
      'workPreferences', 'domainInterests', 'otherDomainInterest', 'minCompensation',
      'communicationPrefs', 'avatarUrl', 'generativeAvatarOptIn',
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

// POST /api/users/phone/request-code - start phone verification
// NOTE: no SMS provider wired up yet. In dev the code is returned in the response
// so the flow is testable; swap this for a real SMS send (Twilio etc.) in production.
router.post('/phone/request-code', protect, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || String(phone).trim().length < 6) {
      return res.status(400).json({ message: 'A valid phone number is required' });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await User.findByIdAndUpdate(req.user._id, {
      phone: String(phone).trim(),
      phoneVerified: false,
      phoneOtp: code,
      phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });
    res.json({
      message: 'Verification code generated',
      devCode: process.env.NODE_ENV === 'production' ? undefined : code,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/phone/verify - confirm the code
router.post('/phone/verify', protect, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.phoneOtp || !user.phoneOtpExpires) {
      return res.status(400).json({ message: 'Request a verification code first' });
    }
    if (user.phoneOtpExpires < new Date()) {
      return res.status(400).json({ message: 'That code has expired — request a new one' });
    }
    if (String(code).trim() !== user.phoneOtp) {
      return res.status(401).json({ message: 'Incorrect verification code' });
    }
    user.phoneVerified = true;
    user.phoneOtp = '';
    user.phoneOtpExpires = null;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/change-email - change the current user's email (requires password confirmation)
router.put('/change-email', protect, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    if (!newEmail || !password) {
      return res.status(400).json({ message: 'New email and current password are required' });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(newEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    const user = await User.findById(req.user._id);
    const matches = await user.comparePassword(password);
    if (!matches) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }
    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing && String(existing._id) !== String(user._id)) {
      return res.status(409).json({ message: 'That email is already in use' });
    }
    user.email = newEmail.toLowerCase();
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/account - permanently delete the current user's account
router.delete('/account', protect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password confirmation is required to delete your account' });
    }
    const user = await User.findById(req.user._id);
    const matches = await user.comparePassword(password);
    if (!matches) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;