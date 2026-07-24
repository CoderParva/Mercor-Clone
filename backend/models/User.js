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
    authProvider: { type: String, enum: ['local', 'google', 'linkedin'], default: 'local' },
    role: { type: String, enum: ['candidate', 'recruiter'], default: 'candidate' },
    title: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    hourlyRate: { type: Number },
    resumeUrl: { type: String, default: '' },

    phone: { type: String, default: '' },
    phoneVerified: { type: Boolean, default: false },
    phoneOtp: { type: String, default: '' },
    phoneOtpExpires: { type: Date, default: null },
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

    // Location & work authorization (candidate)
    country: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    timezone: { type: String, default: '' },
    workAuthorization: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    workingFromDifferentCountry: { type: Boolean, default: false },
    legalAttestation: {
      authorizedToWork: { type: Boolean, default: false },
      willNotifyOnChange: { type: Boolean, default: false },
    },

    // Availability (candidate)
    availability: {
      hoursPerWeek: { type: Number },
      startOption: { type: String, default: '' }, // immediately / 1_week / 2_weeks / 1_month
      startDate: { type: String, default: '' },
      employmentType: { type: String, default: '' }, // full-time / part-time / contract / either
    },
    workingHours: {
      mon: [{ start: String, end: String }],
      tue: [{ start: String, end: String }],
      wed: [{ start: String, end: String }],
      thu: [{ start: String, end: String }],
      fri: [{ start: String, end: String }],
      sat: [{ start: String, end: String }],
      sun: [{ start: String, end: String }],
    },
    dateExceptions: [
      { date: String, available: Boolean, note: String },
    ],

    // Work preferences (candidate)
    workPreferences: {
      remotePreference: { type: String, default: '' }, // remote / hybrid / onsite / no preference
      willingToRelocate: { type: Boolean, default: false },
      desiredPayMin: { type: Number },
      desiredPayMax: { type: Number },
    },
    domainInterests: [{ type: String }],
    otherDomainInterest: { type: String, default: '' },
    minCompensation: {
      fullTime: { type: Number, default: 0 },
      partTime: { type: Number, default: 0 },
    },

    // Communications (both roles)
    communicationPrefs: {
      lookingForWork: { type: Boolean, default: true },
      emailChannel: { type: Boolean, default: true },
      smsChannel: { type: Boolean, default: true },
      fullTimeOpportunities: { type: Boolean, default: true },
      partTimeOpportunities: { type: Boolean, default: true },
      referralOpportunities: { type: Boolean, default: true },
      jobOpportunityNotifs: { type: Boolean, default: true },
      workUpdateNotifs: { type: Boolean, default: true },
      unsubscribedAll: { type: Boolean, default: false },
      preferredContact: { type: String, default: 'email' },
    },

    // Account (both roles)
    avatarUrl: { type: String, default: '' },
    generativeAvatarOptIn: { type: Boolean, default: false },

    // Company profile (recruiter only)
    companyName: { type: String, default: '' },
    companyWebsite: { type: String, default: '' },
    positionAtCompany: { type: String, default: '' },
    department: { type: String, default: '' },
    companySize: { type: String, default: '' },
    industry: { type: String, default: '' },
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