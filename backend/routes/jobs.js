const express = require('express');
const Job = require('../models/Job');
const { protect, requireRole } = require('../middleware/auth');
const { isPositiveNumber } = require('../utils/validators');

const router = express.Router();

// GET /api/jobs - public, list open jobs (with optional search/filter/sort)
router.get('/', async (req, res) => {
  try {
    const Application = require('../models/Application');
    const { q, category, skill, sort } = req.query;
    const filter = { status: 'open' };
    if (category) filter.category = category;
    if (skill) filter.skills = { $in: [skill] };
    if (q) filter.title = { $regex: q, $options: 'i' };

    let sortSpec = { createdAt: -1 };
    if (sort === 'payHigh') sortSpec = { payMax: -1 };
    else if (sort === 'payLow') sortSpec = { payMin: 1 };
    else if (sort === 'oldest') sortSpec = { createdAt: 1 };

    const jobs = await Job.find(filter).populate('postedBy', 'name').sort(sortSpec).lean();
    const jobIds = jobs.map((j) => j._id);
    const counts = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$job', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    const jobsWithCounts = jobs.map((j) => ({ ...j, applicantCount: countMap[String(j._id)] || 0 }));

    res.json({ jobs: jobsWithCounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/categories - distinct category list for filter UI
router.get('/meta/categories', async (req, res) => {
  const categories = await Job.distinct('category', { status: 'open' });
  res.json({ categories });
});

// GET /api/jobs/mine - recruiter's own posted jobs
router.get('/mine', protect, requireRole('recruiter'), async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ jobs });
});

// GET /api/jobs/mine/stats - recruiter dashboard summary numbers
router.get('/mine/stats', protect, requireRole('recruiter'), async (req, res) => {
  const Application = require('../models/Application');
  const jobs = await Job.find({ postedBy: req.user._id });
  const jobIds = jobs.map((j) => j._id);
  const applications = await Application.find({ job: { $in: jobIds } });
  const accepted = applications.filter((a) => a.status === 'accepted').length;
  res.json({
    totalRoles: jobs.length,
    openRoles: jobs.filter((j) => j.status === 'open').length,
    totalApplicants: applications.length,
    accepted,
  });
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/jobs - recruiter only
router.post('/', protect, requireRole('recruiter'), async (req, res, next) => {
  try {
    const { title, description, category, payMin, payMax, skills } = req.body;
    if (!title || typeof title !== 'string' || !description || typeof description !== 'string') {
      return res.status(400).json({ message: 'title and description are required strings' });
    }
    const min = Number(payMin);
    const max = Number(payMax);
    if (!isPositiveNumber(min) || !isPositiveNumber(max)) {
      return res.status(400).json({ message: 'payMin and payMax must be valid non-negative numbers' });
    }
    if (min > max) {
      return res.status(400).json({ message: 'payMin cannot exceed payMax' });
    }
    const skillsArray = Array.isArray(skills)
      ? skills.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())
      : [];
    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      category,
      skills: skillsArray,
      payMin: min,
      payMax: max,
      postedBy: req.user._id,
    });
    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id - recruiter only, must own job
router.put('/:id', protect, requireRole('recruiter'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your job posting' });
    }
    Object.assign(job, req.body);
    await job.save();
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', protect, requireRole('recruiter'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your job posting' });
    }
    await job.deleteOne();
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
