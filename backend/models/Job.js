const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true }, // overview / intro paragraph
    category: { type: String, default: 'General' },
    skills: [{ type: String }],
    payMin: { type: Number, required: true },
    payMax: { type: Number, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    hiresCount: { type: Number, default: 0 },

    // Structured job description sections (each entry renders as one bullet)
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    preferredQualifications: [{ type: String }],
    whyJoin: [{ type: String }],

    // Filterable facets
    workArrangement: { type: String, enum: ['remote', 'hybrid', 'onsite', ''], default: '' },
    contractType: { type: String, enum: ['hourly', 'fixed', 'full-time', 'part-time', ''], default: '' },
    locations: [{ type: String }],
    domain: { type: String, default: '' },
    referralAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);