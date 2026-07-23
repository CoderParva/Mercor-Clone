import { useEffect, useState, Fragment } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category: '', payMin: '', payMax: '', skills: '',
    responsibilities: '', requirements: '', preferredQualifications: '', whyJoin: '',
    workArrangement: '', contractType: '', locations: '', domain: '', referralAmount: '',
  });
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
      const lines = (v) => v.split('\n').map((x) => x.trim()).filter(Boolean);
      const csv = (v) => v.split(',').map((x) => x.trim()).filter(Boolean);
      await api.post('/jobs', {
        title: form.title,
        description: form.description,
        category: form.category,
        payMin: Number(form.payMin),
        payMax: Number(form.payMax),
        skills: csv(form.skills),
        responsibilities: lines(form.responsibilities),
        requirements: lines(form.requirements),
        preferredQualifications: lines(form.preferredQualifications),
        whyJoin: lines(form.whyJoin),
        locations: csv(form.locations),
        workArrangement: form.workArrangement,
        contractType: form.contractType,
        domain: form.domain,
        referralAmount: Number(form.referralAmount) || 0,
      });
      setForm({
        title: '', description: '', category: '', payMin: '', payMax: '', skills: '',
        responsibilities: '', requirements: '', preferredQualifications: '', whyJoin: '',
        workArrangement: '', contractType: '', locations: '', domain: '', referralAmount: '',
      });
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
          <textarea placeholder="Overview — a short intro paragraph about the role" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />

          <div className="pay-row">
            <input type="number" placeholder="Pay min ($/hr)" value={form.payMin} onChange={(e) => setForm({ ...form, payMin: e.target.value })} required />
            <input type="number" placeholder="Pay max ($/hr)" value={form.payMax} onChange={(e) => setForm({ ...form, payMax: e.target.value })} required />
          </div>

          <div className="pay-row">
            <select value={form.workArrangement} onChange={(e) => setForm({ ...form, workArrangement: e.target.value })}>
              <option value="">Work arrangement...</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
            <select value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })}>
              <option value="">Contract type...</option>
              <option value="hourly">Hourly contract</option>
              <option value="fixed">Fixed price</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
            </select>
          </div>

          <div className="pay-row">
            <input placeholder="Domain (e.g. Software engineering)" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
            <input type="number" placeholder="Referral bonus ($)" value={form.referralAmount} onChange={(e) => setForm({ ...form, referralAmount: e.target.value })} />
          </div>

          <input placeholder="Locations (comma separated, e.g. India, United States)" value={form.locations} onChange={(e) => setForm({ ...form, locations: e.target.value })} />

          <p className="resume-hint" style={{ margin: '0.5rem 0 0' }}>
            For the sections below, put <strong>one bullet per line</strong> — they render as clean bulleted lists on the job page.
          </p>
          <textarea placeholder="Responsibilities — one per line" rows={4} value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} />
          <textarea placeholder="Requirements — one per line" rows={4} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          <textarea placeholder="Preferred qualifications — one per line" rows={3} value={form.preferredQualifications} onChange={(e) => setForm({ ...form, preferredQualifications: e.target.value })} />
          <textarea placeholder="Why join — one per line" rows={3} value={form.whyJoin} onChange={(e) => setForm({ ...form, whyJoin: e.target.value })} />

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