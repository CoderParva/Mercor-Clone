const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const educationSchema = new mongoose.Schema(
  { school: String, degree: String, startYear: Number, endYear: Number, major: String, gpa: String },
  { _id: false }
);

const workExperienceSchema = new mongoose.Schema(
  {
    company: String,
    role: String,
    startYear: Number,
    endYear: Number,
    city: String,
    country: String,
    description: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  { name: String, startYear: Number, endYear: Number, description: String },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['candidate', 'recruiter'], default: 'candidate' },
    title: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    hourlyRate: { type: Number },
    resumeUrl: { type: String, default: '' },

    // Resume tab fields
    phone: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    summary: { type: String, default: '' },
    education: [educationSchema],
    workExperience: [workExperienceSchema],
    projects: [projectSchema],
    publications: [{ type: String }],
    certifications: [{ type: String }],
    awards: [{ type: String }],
    profiles: {
      leetcode: { type: String, default: '' },
      github: { type: String, default: '' },
      codechef: { type: String, default: '' },
      codeforces: { type: String, default: '' },
    },
    portfolioUrl: { type: String, default: '' },
    otherLinks: [{ type: String }],
    languages: [{ type: String }],
    hobbies: [{ type: String }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);