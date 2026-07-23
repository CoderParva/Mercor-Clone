const express = require('express');
const Job = require('../models/Job');
const { protect, requireRole } = require('../middleware/auth');
const { isPositiveNumber } = require('../utils/validators');

const router = express.Router();

// Normalizes category text so "full time", "Fulltime", "FULL TIME " etc. all
// collapse to one consistent value ("Full Time") instead of becoming separate
// duplicate categories in the filter dropdown.
function normalizeCategory(raw) {
  if (typeof raw !== 'string') return 'General';
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'General';
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// GET /api/jobs - public, list open jobs (with optional search/filter/sort)
router.get('/', async (req, res) => {
  try {
    const Application = require('../models/Application');
    const {
      q, category, skill, sort,
      minPay, location, domain, workArrangement, contractType, minReferral,
    } = req.query;

    const filter = { status: 'open' };
    if (category) filter.category = category;
    if (skill) filter.skills = { $in: [skill] };
    if (q) filter.title = { $regex: q, $options: 'i' };
    if (domain) filter.domain = domain;
    if (workArrangement) filter.workArrangement = workArrangement;
    if (contractType) filter.contractType = contractType;
    if (location) filter.locations = { $in: [location] };
    if (minPay && !Number.isNaN(Number(minPay))) filter.payMax = { $gte: Number(minPay) };
    if (minReferral && !Number.isNaN(Number(minReferral))) {
      filter.referralAmount = { $gte: Number(minReferral) };
    }

    let sortSpec = { createdAt: -1 };
    if (sort === 'payHigh') sortSpec = { payMax: -1 };
    else if (sort === 'payLow') sortSpec = { payMin: 1 };
    else if (sort === 'oldest') sortSpec = { createdAt: 1 };
    else if (sort === 'referralHigh') sortSpec = { referralAmount: -1 };

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

// GET /api/jobs/meta/facets - all distinct filter values for the filter dropdown
router.get('/meta/facets', async (req, res) => {
  try {
    const [categories, domains, locations] = await Promise.all([
      Job.distinct('category', { status: 'open' }),
      Job.distinct('domain', { status: 'open' }),
      Job.distinct('locations', { status: 'open' }),
    ]);
    res.json({
      categories: categories.filter(Boolean),
      domains: domains.filter(Boolean),
      locations: locations.filter(Boolean),
      workArrangements: ['remote', 'hybrid', 'onsite'],
      contractTypes: ['hourly', 'fixed', 'full-time', 'part-time'],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
    const job = await Job.findById(req.params.id).populate('postedBy', 'name companyName bio');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/:id/similar - a few other open roles in the same category/domain
router.get('/:id/similar', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const orConditions = [];
    if (job.category) orConditions.push({ category: job.category });
    if (job.domain) orConditions.push({ domain: job.domain });

    const filter = {
      _id: { $ne: job._id },
      status: 'open',
      ...(orConditions.length > 0 ? { $or: orConditions } : {}),
    };

    const similar = await Job.find(filter).sort({ createdAt: -1 }).limit(4);
    res.json({ jobs: similar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/jobs - recruiter only
router.post('/', protect, requireRole('recruiter'), async (req, res, next) => {
  try {
    const {
      title, description, category, payMin, payMax, skills,
      responsibilities, requirements, preferredQualifications, whyJoin,
      workArrangement, contractType, locations, domain, referralAmount,
    } = req.body;

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

    const cleanList = (v) =>
      Array.isArray(v) ? v.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()) : [];

    const skillsArray = cleanList(skills);
    const allowedArrangements = ['remote', 'hybrid', 'onsite', ''];
    const allowedContracts = ['hourly', 'fixed', 'full-time', 'part-time', ''];

    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      category: normalizeCategory(category),
      skills: skillsArray,
      payMin: min,
      payMax: max,
      postedBy: req.user._id,
      responsibilities: cleanList(responsibilities),
      requirements: cleanList(requirements),
      preferredQualifications: cleanList(preferredQualifications),
      whyJoin: cleanList(whyJoin),
      locations: cleanList(locations),
      workArrangement: allowedArrangements.includes(workArrangement) ? workArrangement : '',
      contractType: allowedContracts.includes(contractType) ? contractType : '',
      domain: typeof domain === 'string' ? domain.trim() : '',
      referralAmount: Number(referralAmount) > 0 ? Number(referralAmount) : 0,
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
    if (req.body.category !== undefined) {
      job.category = normalizeCategory(req.body.category);
    }
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