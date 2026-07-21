const express = require('express');
const Interview = require('../models/Interview');
const Job = require('../models/Job');
const { protect, requireRole } = require('../middleware/auth');
const { generateQuestions, scoreInterview } = require('../services/aiInterview');

const router = express.Router();

// POST /api/interviews/start - candidate starts an AI interview for a job
router.post('/start', protect, requireRole('candidate'), async (req, res, next) => {
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const questionStrings = await generateQuestions(job);
    const interview = await Interview.create({
      job: jobId,
      candidate: req.user._id,
      questions: questionStrings.map((q) => ({ question: q, answer: '' })),
    });
    res.status(201).json({ interview });
  } catch (err) {
    next(err);
  }
});

// PUT /api/interviews/:id/submit - candidate submits answers, gets AI score back
router.put('/:id/submit', protect, requireRole('candidate'), async (req, res, next) => {
  try {
    const { answers } = req.body; // array of strings, same order as questions
    const interview = await Interview.findById(req.params.id).populate('job');
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (String(interview.candidate) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your interview' });
    }
    if (interview.status === 'completed') {
      return res.status(409).json({ message: 'Interview already completed' });
    }
    if (!Array.isArray(answers) || answers.length !== interview.questions.length) {
      return res.status(400).json({ message: `Expected ${interview.questions.length} answers` });
    }

    interview.questions.forEach((q, i) => {
      q.answer = (answers[i] || '').trim();
    });

    const { score, feedback, perQuestion } = await scoreInterview(interview.job, interview.questions);
    interview.score = score;
    interview.feedback = feedback;
    perQuestion.forEach((pq, i) => {
      if (interview.questions[i]) {
        interview.questions[i].score = pq.score;
        interview.questions[i].feedback = pq.feedback;
      }
    });
    interview.status = 'completed';
    await interview.save();

    res.json({ interview });
  } catch (err) {
    next(err);
  }
});

// GET /api/interviews/mine - candidate's own interviews
router.get('/mine', protect, requireRole('candidate'), async (req, res) => {
  const interviews = await Interview.find({ candidate: req.user._id })
    .populate('job', 'title category')
    .sort({ createdAt: -1 });
  res.json({ interviews });
});

// GET /api/interviews/job/:jobId - recruiter views all interviews for their job's applicants
router.get('/job/:jobId', protect, requireRole('recruiter'), async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (String(job.postedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your job posting' });
  }
  const interviews = await Interview.find({ job: req.params.jobId })
    .populate('candidate', 'name email')
    .sort({ createdAt: -1 });
  res.json({ interviews });
});

module.exports = router;