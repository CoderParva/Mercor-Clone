const request = require('supertest');
const app = require('../app');

async function registerAndLogin(role, email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email, password: 'password123', role });
  return res.body.token;
}

describe('Application flow (end to end)', () => {
  test('candidate can apply, recruiter can view and update status', async () => {
    const recruiterToken = await registerAndLogin('recruiter', 'flow-rec@test.com');
    const candidateToken = await registerAndLogin('candidate', 'flow-cand@test.com');

    // Recruiter posts a job
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Flow Job', description: 'desc', payMin: 50, payMax: 80 });
    const jobId = jobRes.body.job._id;

    // Candidate applies
    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId, coverNote: 'I am a great fit' });
    expect(applyRes.status).toBe(201);
    const applicationId = applyRes.body.application._id;

    // Candidate cannot apply twice
    const dupRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId, coverNote: 'Again' });
    expect(dupRes.status).toBe(409);

    // Candidate sees it in their own list
    const mineRes = await request(app)
      .get('/api/applications/mine')
      .set('Authorization', `Bearer ${candidateToken}`);
    expect(mineRes.body.applications.length).toBe(1);
    expect(mineRes.body.applications[0].status).toBe('pending');

    // Recruiter sees the applicant
    const applicantsRes = await request(app)
      .get(`/api/applications/job/${jobId}`)
      .set('Authorization', `Bearer ${recruiterToken}`);
    expect(applicantsRes.status).toBe(200);
    expect(applicantsRes.body.applications.length).toBe(1);

    // Recruiter updates status
    const updateRes = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ status: 'accepted' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.application.status).toBe('accepted');
  });

  test('a recruiter cannot view applicants for a job they do not own', async () => {
    const recA = await registerAndLogin('recruiter', 'ownerA@test.com');
    const recB = await registerAndLogin('recruiter', 'ownerB@test.com');

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recA}`)
      .send({ title: 'Owned Job', description: 'desc', payMin: 10, payMax: 20 });

    const res = await request(app)
      .get(`/api/applications/job/${jobRes.body.job._id}`)
      .set('Authorization', `Bearer ${recB}`);

    expect(res.status).toBe(403);
  });

  test('accepting an application increments the job hiresCount, un-accepting decrements it', async () => {
    const recruiterToken = await registerAndLogin('recruiter', 'hires-rec@test.com');
    const candidateToken = await registerAndLogin('candidate', 'hires-cand@test.com');

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Hires Job', description: 'desc', payMin: 50, payMax: 80 });
    const jobId = jobRes.body.job._id;
    expect(jobRes.body.job.hiresCount).toBe(0);

    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId, coverNote: 'note' });
    const applicationId = applyRes.body.application._id;

    await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ status: 'accepted' });

    let jobCheck = await request(app).get(`/api/jobs/${jobId}`);
    expect(jobCheck.body.job.hiresCount).toBe(1);

    await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ status: 'rejected' });

    jobCheck = await request(app).get(`/api/jobs/${jobId}`);
    expect(jobCheck.body.job.hiresCount).toBe(0);
  });

  test('rejects an invalid status value', async () => {
    const recruiterToken = await registerAndLogin('recruiter', 'badstatus-rec@test.com');
    const candidateToken = await registerAndLogin('candidate', 'badstatus-cand@test.com');

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Status Job', description: 'desc', payMin: 10, payMax: 20 });

    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId: jobRes.body.job._id, coverNote: 'note' });

    const res = await request(app)
      .put(`/api/applications/${applyRes.body.application._id}/status`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ status: 'made_up_status' });

    expect(res.status).toBe(400);
  });
});
