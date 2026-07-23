// One-time cleanup script: normalizes existing job categories so duplicates
// like "Fulltime" / "Full time" / "full time" collapse into one consistent value.
// Run once with: node scripts/normalizeCategories.js
// Reads MONGO_URI from your .env file — make sure .env is set up first.

require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');

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

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found in .env — aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const jobs = await Job.find({});
  console.log(`Found ${jobs.length} jobs. Checking categories...`);

  let changed = 0;
  for (const job of jobs) {
    const normalized = normalizeCategory(job.category);
    if (normalized !== job.category) {
      console.log(`  "${job.category}" -> "${normalized}" (job: ${job.title})`);
      job.category = normalized;
      await job.save();
      changed++;
    }
  }

  console.log(`Done. Updated ${changed} of ${jobs.length} jobs.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});