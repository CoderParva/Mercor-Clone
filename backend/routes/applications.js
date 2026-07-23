const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/applications/progress/:jobId - checklist state for this candidate + job
router.get('/progress/:jobId', protect, requireRole('candidate'), async (req, res) => {
  try {
    const Interview = require('../models/Interview');
    const user = req.user;

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const [interview, application] = await Promise.all([
      Interview.findOne({ job: req.params.jobId, candidate: user._id }).sort({ createdAt: -1 }),
      Application.findOne({ job: req.params.jobId, candidate: user._id }),
    ]);

    const profileComplete = !!(
      user.title ||
      user.summary ||
      user.education?.length ||
      user.workExperience?.length
    );

    const steps = [
      {
        key: 'phone',
        label: 'Phone verification',
        done: !!user.phoneVerified,
        route: '/profile',
        hint: 'Verify your phone number in your profile.',
      },
      {
        key: 'resume',
        label: 'Profile & resume',
        done: profileComplete,
        route: '/profile',
        hint: 'Fill in your resume details so recruiters can evaluate you.',
      },
      {
        key: 'workAuth',
        label: 'Work authorization',
        done: !!user.workAuthorization,
        route: '/profile',
        hint: 'Confirm where you are legally authorized to work.',
      },
      {
        key: 'interview',
        label: 'AI Interview',
        core: true,
        done: interview?.status === 'completed',
        inProgress: interview?.status === 'in_progress',
        route: `/jobs/${req.params.jobId}/interview`,
        hint: 'A short spoken interview tailored to this role.',
      },
    ];

    const completed = steps.filter((s) => s.done).length;

    res.json({
      steps,
      completed,
      total: steps.length,
      percent: Math.round((completed / steps.length) * 100),
      applied: !!application,
      job: { _id: job._id, title: job.title, payMin: job.payMin, payMax: job.payMax },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/applications - candidate applies to a job
router.post('/', protect, requireRole('candidate'), async (req, res) => {
  try {
    const { jobId, coverNote } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const application = await Application.create({
      job: jobId,
      candidate: req.user._id,
      coverNote,
    });
    res.status(201).json({ application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You already applied to this job' });
    }
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/mine - candidate's own applications
router.get('/mine', protect, requireRole('candidate'), async (req, res) => {
  const applications = await Application.find({ candidate: req.user._id })
    .populate('job')
    .sort({ createdAt: -1 });
  res.json({ applications });
});

// GET /api/applications/job/:jobId - recruiter views applicants for their job
router.get('/job/:jobId', protect, requireRole('recruiter'), async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (String(job.postedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your job posting' });
  }
  const applications = await Application.find({ job: req.params.jobId })
    .populate('candidate', '-password')
    .sort({ createdAt: -1 });
  res.json({ applications });
});

// PUT /api/applications/:id/status - recruiter updates application status
router.put('/:id/status', protect, requireRole('recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (String(application.job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your job posting' });
    }
    const wasAccepted = application.status === 'accepted';
    application.status = status;
    await application.save();

    if (status === 'accepted' && !wasAccepted) {
      await Job.findByIdAndUpdate(application.job._id, { $inc: { hiresCount: 1 } });
    } else if (wasAccepted && status !== 'accepted') {
      await Job.findByIdAndUpdate(application.job._id, { $inc: { hiresCount: -1 } });
    }

    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;