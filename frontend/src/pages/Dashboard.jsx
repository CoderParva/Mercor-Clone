import { useEffect, useState, Fragment } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', payMin: '', payMax: '', skills: '' });
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [interviewsByCandidateId, setInterviewsByCandidateId] = useState({});
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);

  const loadJobs = () => api.get('/jobs/mine').then((res) => setJobs(res.data.jobs));
  const loadStats = () => api.get('/jobs/mine/stats').then((res) => setStats(res.data));

  useEffect(() => {
    loadJobs();
    loadStats();
  }, []);

  const createJob = async (e) => {
    e.preventDefault();
    try {
      await api.post('/jobs', {
        ...form,
        payMin: Number(form.payMin),
        payMax: Number(form.payMax),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setForm({ title: '', description: '', category: '', payMin: '', payMax: '', skills: '' });
      showToast('Role posted successfully', 'success');
      loadJobs();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post job', 'error');
    }
  };

  const viewApplicants = async (job) => {
    setSelectedJob(job);
    const [appsRes, interviewsRes] = await Promise.all([
      api.get(`/applications/job/${job._id}`),
      api.get(`/interviews/job/${job._id}`),
    ]);
    setApplicants(appsRes.data.applications);
    const map = {};
    interviewsRes.data.interviews.forEach((iv) => {
      if (iv.candidate?._id) map[iv.candidate._id] = iv;
    });
    setInterviewsByCandidateId(map);
  };

  const updateStatus = async (appId, newStatus) => {
    try {
      await api.put(`/applications/${appId}/status`, { status: newStatus });
      showToast(`Application marked as ${newStatus}`, 'success');
      viewApplicants(selectedJob);
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="page">
      <h1>Recruiter dashboard</h1>

      {stats && (
        <section className="stats-cards">
          <div className="stat-card"><strong>{stats.totalRoles}</strong><span>Total roles</span></div>
          <div className="stat-card"><strong>{stats.openRoles}</strong><span>Open roles</span></div>
          <div className="stat-card"><strong>{stats.totalApplicants}</strong><span>Total applicants</span></div>
          <div className="stat-card"><strong>{stats.accepted}</strong><span>Accepted</span></div>
        </section>
      )}

      <section className="dashboard-section">
        <h2>Post a new role</h2>
        <form className="job-form" onSubmit={createJob}>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input placeholder="Skills (comma separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          <textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div className="pay-row">
            <input type="number" placeholder="Pay min ($/hr)" value={form.payMin} onChange={(e) => setForm({ ...form, payMin: e.target.value })} required />
            <input type="number" placeholder="Pay max ($/hr)" value={form.payMax} onChange={(e) => setForm({ ...form, payMax: e.target.value })} required />
          </div>
          <button type="submit" className="btn primary">Post role</button>
        </form>
      </section>

      <section className="dashboard-section">
        <h2>Your roles</h2>
        <div className="job-list-simple">
          {jobs.map((job) => (
            <div key={job._id} className="job-row" onClick={() => viewApplicants(job)}>
              <span>{job.title}</span>
              <span>${job.payMin}-${job.payMax}/hr</span>
              <button className="link-btn">View applicants</button>
            </div>
          ))}
        </div>
      </section>

      {selectedJob && (
        <section className="dashboard-section">
          <h2>Applicants for "{selectedJob.title}"</h2>
          <table className="table">
            <thead>
              <tr><th>Candidate</th><th>Cover note</th><th>AI Interview</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {applicants.map((app) => {
                const interview = interviewsByCandidateId[app.candidate?._id];
                const candidate = app.candidate;
                const isExpanded = expandedCandidateId === candidate?._id;
                return (
                  <Fragment key={app._id}>
                    <tr>
                      <td>
                        {candidate?.name}
                        <br />
                        <button
                          type="button"
                          className="link-btn"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => setExpandedCandidateId(isExpanded ? null : candidate?._id)}
                        >
                          {isExpanded ? 'Hide profile' : 'View profile'}
                        </button>
                      </td>
                      <td>{app.coverNote}</td>
                      <td>
                        {interview?.status === 'completed' ? (
                          <span className="interview-score-badge" title={interview.feedback}>
                            {interview.score}/10
                          </span>
                        ) : interview ? (
                          <span className="interview-score-badge pending">In progress</span>
                        ) : (
                          <span className="interview-score-badge none">Not taken</span>
                        )}
                      </td>
                      <td><span className={`badge ${app.status}`}>{app.status}</span></td>
                      <td>
                        <select value={app.status} onChange={(e) => updateStatus(app._id, e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="candidate-profile-row">
                        <td colSpan={5}>
                          <div className="candidate-profile-panel">
                            <div className="candidate-profile-header">
                              <strong>{candidate?.name}</strong>
                              {candidate?.title && <span> — {candidate.title}</span>}
                              <span className="candidate-profile-email">{candidate?.email}</span>
                              {candidate?.phone && <span> · {candidate.phone}</span>}
                              {candidate?.linkedinUrl && (
                                <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer"> · LinkedIn</a>
                              )}
                            </div>

                            {candidate?.bio && <p className="candidate-profile-bio">{candidate.bio}</p>}

                            {candidate?.skills?.length > 0 && (
                              <div className="skill-tags">
                                {candidate.skills.map((s) => (
                                  <span className="skill-tag" key={s}>{s}</span>
                                ))}
                              </div>
                            )}

                            {candidate?.education?.length > 0 && (
                              <div className="candidate-profile-block">
                                <span className="resume-hint">Education</span>
                                {candidate.education.map((ed, i) => (
                                  <p key={i}>{ed.degree} — {ed.school} {ed.startYear ? `(${ed.startYear}-${ed.endYear || ''})` : ''}</p>
                                ))}
                              </div>
                            )}

                            {candidate?.workExperience?.length > 0 && (
                              <div className="candidate-profile-block">
                                <span className="resume-hint">Work Experience</span>
                                {candidate.workExperience.map((w, i) => (
                                  <p key={i}>{w.role} at {w.company} {w.startYear ? `(${w.startYear}-${w.endYear || ''})` : ''}</p>
                                ))}
                              </div>
                            )}

                            {candidate?.projects?.length > 0 && (
                              <div className="candidate-profile-block">
                                <span className="resume-hint">Projects</span>
                                {candidate.projects.map((p, i) => (
                                  <p key={i}>{p.name}{p.description ? ` — ${p.description}` : ''}</p>
                                ))}
                              </div>
                            )}

                            {!candidate?.bio && !candidate?.title && !candidate?.education?.length && !candidate?.workExperience?.length && (
                              <p className="resume-empty">This candidate hasn't filled out their profile yet.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {applicants.length === 0 && <p>No applicants yet.</p>}
        </section>
      )}
    </div>
  );
}