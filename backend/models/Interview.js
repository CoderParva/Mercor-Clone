const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [
      {
        question: { type: String, required: true },
        answer: { type: String, default: '' },
        followUpQuestion: { type: String, default: '' },
        followUpAnswer: { type: String, default: '' },
        score: { type: Number, min: 1, max: 10 },
        feedback: { type: String, default: '' },
      },
    ],
    currentIndex: { type: Number, default: 0 },
    phase: { type: String, enum: ['main', 'followup', 'done'], default: 'main' },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    score: { type: Number, min: 1, max: 10 },
    feedback: { type: String, default: '' },
  },
  { timestamps: true }
);

// One in-progress interview per candidate per job at a time
interviewSchema.index({ job: 1, candidate: 1 });

module.exports = mongoose.model('Interview', interviewSchema);