jest.mock('../services/aiInterview', () => ({
  generateQuestions: jest.fn().mockResolvedValue([
    'Tell me about a challenging bug you fixed.',
    'How do you approach testing your code?',
    'Describe a time you had to learn a new technology quickly.',
    'How do you handle disagreements with a teammate on technical direction?',
  ]),
  scoreInterview: jest.fn().mockResolvedValue({
    score: 8,
    feedback: 'Strong, specific answers with good technical depth. Minor gaps in testing strategy detail.',
  }),
}));

const request = require('supertest');
const app = require('../app');

async function registerAndLogin(role, email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email, password: 'password123', role });
  return res.body.token;
}

describe('AI Interview flow', () => {
  test('candidate can start an interview and receives generated questions', async () => {
    const recruiterToken = await registerAndLogin('recruiter', 'ai-rec@test.com');
    const candidateToken = await registerAndLogin('candidate', 'ai-cand@test.com');

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Backend Engineer', description: 'Node.js role', payMin: 50, payMax: 80 });

    const startRes = await request(app)
      .post('/api/interviews/start')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId: jobRes.body.job._id });

    expect(startRes.status).toBe(201);
    expect(startRes.body.interview.questions).toHaveLength(4);
    expect(startRes.body.interview.status).toBe('in_progress');
  });

  test('recruiters cannot start an interview (role guard)', async () => {
    const recruiterToken = await registerAndLogin('recruiter', 'ai-rec2@test.com');
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Job', description: 'desc', payMin: 10, payMax: 20 });

    const res = await request(app)
      .post('/api/interviews/start')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ jobId: jobRes.body.job._id });

    expect(res.status).toBe(403);
  });

  test('candidate can submit answers and receives an AI score', async () => {
    const recruiterToken = await registerAndLogin('recruiter', 'ai-rec3@test.com');
    const candidateToken = await registerAndLogin('candidate', 'ai-cand3@test.com');

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Job', description: 'desc', payMin: 10, payMax: 20 });

    const startRes = await request(app)
      .post('/api/interviews/start')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId: jobRes.body.job._id });

    const interviewId = startRes.body.interview._id;
    const answers = ['answer 1', 'answer 2', 'answer 3', 'answer 4'];

    const submitRes = await request(app)
      .put(`/api/interviews/${interviewId}/submit`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ answers });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.interview.status).toBe('completed');
    expect(submitRes.body.interview.score).toBe(8);
    expect(submitRes.body.interview.feedback).toMatch(/technical depth/);
  });

  test('rejects submission with wrong number of answers', async () => {
    const recruiterToken = await registerAndLogin('recruiter', 'ai-rec4@test.com');
    const candidateToken = await registerAndLogin('candidate', 'ai-cand4@test.com');

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Job', description: 'desc', payMin: 10, payMax: 20 });

    const startRes = await request(app)
      .post('/api/interviews/start')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId: jobRes.body.job._id });

    const res = await request(app)
      .put(`/api/interviews/${startRes.body.interview._id}/submit`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ answers: ['only one answer'] });

    expect(res.status).toBe(400);
  });

  test('a candidate cannot submit another candidate\'s interview', async () => {
    const recruiterToken = await registerAndLogin('recruiter', 'ai-rec5@test.com');
    const candidateAToken = await registerAndLogin('candidate', 'ai-candA@test.com');
    const candidateBToken = await registerAndLogin('candidate', 'ai-candB@test.com');

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Job', description: 'desc', payMin: 10, payMax: 20 });

    const startRes = await request(app)
      .post('/api/interviews/start')
      .set('Authorization', `Bearer ${candidateAToken}`)
      .send({ jobId: jobRes.body.job._id });

    const res = await request(app)
      .put(`/api/interviews/${startRes.body.interview._id}/submit`)
      .set('Authorization', `Bearer ${candidateBToken}`)
      .send({ answers: ['a', 'b', 'c', 'd'] });

    expect(res.status).toBe(403);
  });

  test('recruiter can view interviews for their job, not for others\' jobs', async () => {
    const recruiterAToken = await registerAndLogin('recruiter', 'ai-recA@test.com');
    const recruiterBToken = await registerAndLogin('recruiter', 'ai-recB@test.com');
    const candidateToken = await registerAndLogin('candidate', 'ai-cand6@test.com');

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterAToken}`)
      .send({ title: 'Job', description: 'desc', payMin: 10, payMax: 20 });

    await request(app)
      .post('/api/interviews/start')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId: jobRes.body.job._id });

    const ownRes = await request(app)
      .get(`/api/interviews/job/${jobRes.body.job._id}`)
      .set('Authorization', `Bearer ${recruiterAToken}`);
    expect(ownRes.status).toBe(200);
    expect(ownRes.body.interviews.length).toBe(1);

    const otherRes = await request(app)
      .get(`/api/interviews/job/${jobRes.body.job._id}`)
      .set('Authorization', `Bearer ${recruiterBToken}`);
    expect(otherRes.status).toBe(403);
  });
});
