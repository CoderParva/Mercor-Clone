const request = require('supertest');
const app = require('../app');

async function registerAndLogin(overrides = {}) {
  const user = {
    name: 'Test User',
    email: overrides.email || 'user@test.com',
    password: 'password123',
    role: overrides.role || 'candidate',
  };
  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.token, user: res.body.user };
}

describe('Job routes', () => {
  test('candidates cannot post a job', async () => {
    const { token } = await registerAndLogin({ role: 'candidate', email: 'cand@test.com' });
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Job', description: 'desc', payMin: 10, payMax: 20 });
    expect(res.status).toBe(403);
  });

  test('recruiters can post a job', async () => {
    const { token } = await registerAndLogin({ role: 'recruiter', email: 'rec@test.com' });
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Job', description: 'desc', payMin: 10, payMax: 20 });
    expect(res.status).toBe(201);
    expect(res.body.job.title).toBe('Test Job');
  });

  test('rejects a job where payMin exceeds payMax', async () => {
    const { token } = await registerAndLogin({ role: 'recruiter', email: 'rec2@test.com' });
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bad Job', description: 'desc', payMin: 100, payMax: 10 });
    expect(res.status).toBe(400);
  });

  test('public listing only returns open jobs', async () => {
    const { token } = await registerAndLogin({ role: 'recruiter', email: 'rec3@test.com' });
    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Open Job', description: 'desc', payMin: 10, payMax: 20 });

    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(1);
  });

  test('a recruiter cannot edit another recruiter\'s job', async () => {
    const { token: tokenA } = await registerAndLogin({ role: 'recruiter', email: 'recA@test.com' });
    const { token: tokenB } = await registerAndLogin({ role: 'recruiter', email: 'recB@test.com' });

    const createRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Job A', description: 'desc', payMin: 10, payMax: 20 });

    const jobId = createRes.body.job._id;

    const editRes = await request(app)
      .put(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hijacked title' });

    expect(editRes.status).toBe(403);
  });

  test('stores and returns skills tags on a job', async () => {
    const { token } = await registerAndLogin({ role: 'recruiter', email: 'skills-rec@test.com' });
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'React Dev',
        description: 'desc',
        payMin: 40,
        payMax: 60,
        skills: ['React', 'Node.js', ''],
      });
    expect(res.status).toBe(201);
    expect(res.body.job.skills).toEqual(['React', 'Node.js']);
  });

  test('filters jobs by skill', async () => {
    const { token } = await registerAndLogin({ role: 'recruiter', email: 'filter-rec@test.com' });
    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Python Job', description: 'd', payMin: 10, payMax: 20, skills: ['Python'] });
    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'React Job', description: 'd', payMin: 10, payMax: 20, skills: ['React'] });

    const res = await request(app).get('/api/jobs?skill=React');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(1);
    expect(res.body.jobs[0].title).toBe('React Job');
  });

  test('sorts jobs by highest pay', async () => {
    const { token } = await registerAndLogin({ role: 'recruiter', email: 'sort-rec@test.com' });
    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Low Pay', description: 'd', payMin: 10, payMax: 20 });
    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'High Pay', description: 'd', payMin: 90, payMax: 100 });

    const res = await request(app).get('/api/jobs?sort=payHigh');
    expect(res.body.jobs[0].title).toBe('High Pay');
  });
});
