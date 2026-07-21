const express = require('express');
const Interview = require('../models/Interview');
const Job = require('../models/Job');
const { protect, requireRole } = require('../middleware/auth');
const { generateQuestions, generateFollowUp, scoreInterview } = require('../services/aiInterview');

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

// PUT /api/interviews/:id/answer - candidate submits one answer at a time (main question or follow-up)
// Walks: main Q1 -> follow-up Q1 -> main Q2 -> follow-up Q2 -> ... -> final score
router.put('/:id/answer', protect, requireRole('candidate'), async (req, res, next) => {
  try {
    const { answer } = req.body;
    const interview = await Interview.findById(req.params.id).populate('job');
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (String(interview.candidate) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your interview' });
    }
    if (interview.status === 'completed') {
      return res.status(409).json({ message: 'Interview already completed' });
    }
    if (typeof answer !== 'string' || !answer.trim()) {
      return res.status(400).json({ message: 'An answer is required' });
    }

    const currentQ = interview.questions[interview.currentIndex];
    if (!currentQ) {
      return res.status(400).json({ message: 'Invalid interview state' });
    }

    if (interview.phase === 'main') {
      // Save the main answer, generate a targeted follow-up question
      currentQ.answer = answer.trim();
      const followUp = await generateFollowUp(interview.job, currentQ.question, currentQ.answer);
      currentQ.followUpQuestion = followUp;
      interview.phase = 'followup';
      await interview.save();
      return res.json({ done: false, phase: 'followup', prompt: followUp, interview });
    }

    // phase === 'followup': save follow-up answer, advance to next question or finish
    currentQ.followUpAnswer = answer.trim();
    const nextIndex = interview.currentIndex + 1;

    if (nextIndex < interview.questions.length) {
      interview.currentIndex = nextIndex;
      interview.phase = 'main';
      await interview.save();
      return res.json({
        done: false,
        phase: 'main',
        prompt: interview.questions[nextIndex].question,
        interview,
      });
    }

    // All questions + follow-ups answered — score the whole interview
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
    interview.phase = 'done';
    await interview.save();

    res.json({ done: true, interview });
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