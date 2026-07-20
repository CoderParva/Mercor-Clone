<div align="center">

# TalentMarket

### A full-stack talent marketplace connecting elite candidates with companies hiring for AI-era roles

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Jest](https://img.shields.io/badge/Tested_with-Jest-C21325?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](#license)

**[Live Demo](https://mercor-clone-1.onrender.com)** &nbsp;·&nbsp; **[Setup Guide](#getting-started)** &nbsp;·&nbsp; **[Tests](#testing)**
</div>

---

## Overview

TalentMarket is a MERN-stack marketplace where **candidates** browse and apply to project-based roles, and **recruiters** post roles and manage their applicant pipeline. The UX pattern (sidebar navigation, job explore grid, social-proof badges, resume-builder profile) is inspired by modern talent marketplaces, rebuilt from scratch with original code, copy, and branding.

<br>

## Features

<table>
<tr>
<td width="50%" valign="top">

**Explore & Discovery**
- Job grid with skill tags, pay ranges, and live applicant counts
- Filter by category & skill, sort by pay or recency
- "Hired this month" social-proof badges
- Skeleton loading states & pagination

**Full Resume-Builder Profile**
- Education, work experience & projects (repeatable, add/remove)
- Certifications, awards, publications
- Coding profiles (LeetCode, GitHub, CodeChef, Codeforces)
- Skills, languages, hobbies, portfolio links

</td>
<td width="50%" valign="top">

**Auth & Roles**
- JWT-based authentication
- Role-based access control (candidate vs. recruiter)
- Rate-limited auth routes against brute force

**Recruiter Dashboard**
- Post roles with skill tags & pay bands
- Review applicants, update status pipeline
- Live analytics: total roles, applicants, accepted hires

**Polished UX**
- Toast notifications across every form
- Animated stat counters
- Sidebar navigation (Explore / Home / Referrals / Earnings / Profile)

</td>
</tr>
</table>

<br>

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), React Router v6, Axios, custom CSS (no framework) |
| **Backend** | Node.js, Express, JWT, bcrypt, express-rate-limit |
| **Database** | MongoDB (Mongoose ODM), hosted on MongoDB Atlas |
| **Testing** | Jest + Supertest, `mongodb-memory-server` (isolated in-memory DB) |
| **Architecture** | REST API, stateless JWT auth, role-based route guards |

<br>

## Project Structure

```
mercor-clone/
├── backend/
│   ├── models/          User, Job, Application (Mongoose schemas)
│   ├── routes/          auth, users, jobs, applications
│   ├── middleware/       JWT auth guard, role guard, centralized error handler
│   ├── tests/            Jest + Supertest suite (19 tests)
│   └── server.js
└── frontend/
    └── src/
        ├── pages/         Landing, Explore, JobDetail, CandidateHome,
        │                  Referrals, Earnings, Login, Register,
        │                  Profile, Dashboard (recruiter)
        ├── components/    Sidebar, JobCard, AvatarStack, Skeleton,
        │                  AnimatedCounter, ProtectedRoute
        ├── context/        AuthContext (JWT session), ToastContext (notifications)
        └── api/            Axios instance with auth-header injection
```

<br>

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string ([MongoDB Atlas](https://www.mongodb.com/atlas) free tier works great)

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/talentmarket.git
cd talentmarket
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/talentmarket
JWT_SECRET=your_long_random_secret_here
PORT=5000
```

```bash
npm run dev
```
API running at `http://localhost:5000`

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```
App running at `http://localhost:5173`

<br>

## Testing

```bash
cd backend
npm test
```

19 tests covering auth validation, role-based access control, ownership checks, the full apply-review-accept flow, and edge cases (duplicate applications, invalid statuses, cross-user access attempts). Runs against an in-memory MongoDB instance — no live database required.

<br>

## Roadmap / Known Scope Boundaries

Built with deliberate scope decisions given time constraints — being upfront about what's real vs. UI-only:

| Section | Status |
|---|---|
| Explore, Auth, Applications, Recruiter Dashboard | Fully functional, tested |
| Profile — Resume tab | Fully functional |
| Profile — other 5 tabs (Location, Availability, etc.) | UI placeholder |
| Referrals | UI shell (real "copy link" button, static funnel data) |
| Earnings | UI shell (no payment backend) |
| File uploads, email notifications, admin role | Not yet implemented |

<br>

## License

MIT — free to use, modify, and learn from.

<div align="center">
<br>

Built as a full-stack engineering exercise · [Report an issue](#)

</div>
