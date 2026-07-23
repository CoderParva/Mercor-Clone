import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import JobDescription from './JobDescription';

export default function JobDetailPanel({ jobId, onApply, onClose }) {
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    setProgress(null);
    api
      .get(`/jobs/${jobId}`)
      .then((res) => setJob(res.data.job))
      .finally(() => setLoading(false));

    if (user?.role === 'candidate') {
      api
        .get(`/applications/progress/${jobId}`)
        .then((res) => setProgress(res.data))
        .catch(() => setProgress(null));
    }
  }, [jobId, user]);

  if (!jobId) {
    return (
      <aside className="detail-panel empty">
        <p className="center-msg">Select a role to see the full description.</p>
      </aside>
    );
  }

  if (loading || !job) {
    return (
      <aside className="detail-panel">
        <p className="center-msg">Loading role...</p>
      </aside>
    );
  }

  return (
    <aside className="detail-panel">
      <div className="detail-panel-bar">
        <button className="link-btn" onClick={onClose}>✕ Close</button>
        <Link to={`/jobs/${job._id}`} className="link-btn">Open full page ↗</Link>
      </div>

      <div className="detail-panel-head">
        <div>
          <h2>{job.title}</h2>
          <p className="posted-by">Posted by {job.postedBy?.name}</p>
        </div>
        <div className="detail-panel-pay">
          <strong>
            {job.payMin === job.payMax ? `$${job.payMin}` : `$${job.payMin}-$${job.payMax}`}
          </strong>
          <span>per hour</span>
        </div>
      </div>

      {progress && (
        <section className="detail-application-block">
          <div className="detail-application-head">
            <h3>Application</h3>
            <strong>{progress.percent}%</strong>
          </div>
          <p className="resume-hint">{progress.completed} of {progress.total} steps completed</p>
          <div className="interview-progress-bar">
            <div className="interview-progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>

          <div className="detail-step-rows">
            {progress.steps.map((s) => (
              <div className="detail-step-row" key={s.key}>
                <div>
                  <strong>
                    {s.label}
                    {s.core && <span className="core-tag">CORE</span>}
                  </strong>
                  <span className="resume-hint">
                    {s.done ? 'Completed' : s.inProgress ? 'In progress' : 'Not done'}
                  </span>
                </div>
                <span className={`step-dot ${s.done ? 'done' : ''}`}>{s.done ? '✓' : ''}</span>
              </div>
            ))}
          </div>

          <p className="resume-hint">
            Steps are reused across roles — you never repeat a step you've already finished.
          </p>
        </section>
      )}

      <JobDescription job={job} />

      {user?.role === 'candidate' && (
        <div className="detail-panel-footer">
          <button className="btn primary" onClick={() => onApply(job)}>
            {progress?.completed === progress?.total && progress ? 'Review application' : 'Continue application'}
          </button>
        </div>
      )}
      {!user && (
        <div className="detail-panel-footer">
          <Link to="/login" className="btn primary">Log in to apply</Link>
        </div>
      )}
    </aside>
  );
}