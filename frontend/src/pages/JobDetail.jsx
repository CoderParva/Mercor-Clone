import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import JobDescription from '../components/JobDescription';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [job, setJob] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${id}`).then((res) => setJob(res.data.job));
  }, [id]);

  const apply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/applications', { jobId: id, coverNote });
      showToast('Application submitted!', 'success');
      setCoverNote('');
      setApplied(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to apply', 'error');
    }
  };

  if (!job) return <p className="center-msg">Loading...</p>;

  return (
    <div className="page">
      <h1>{job.title}</h1>
      <p className="pay">${job.payMin}-${job.payMax}/hr &middot; {job.category}</p>
      {job.skills?.length > 0 && (
        <div className="skill-tags">
          {job.skills.map((s) => (
            <span key={s} className="skill-tag">{s}</span>
          ))}
        </div>
      )}
      {job.hiresCount > 0 && <p className="hires-badge inline">{job.hiresCount} hired recently</p>}
      <JobDescription job={job} />
      <p className="posted-by">Posted by {job.postedBy?.name}</p>

      {user?.role === 'candidate' && !applied && (
        <form className="apply-form" onSubmit={apply}>
          <h3>Apply to this role</h3>
          <textarea
            placeholder="Why are you a good fit?"
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            rows={4}
          />
          <button type="submit" className="btn primary">Apply</button>
        </form>
      )}
      {user?.role === 'candidate' && (
        <p style={{ marginTop: '1rem' }}>
          <Link to={`/jobs/${id}/interview`} className="btn secondary">Take AI Interview</Link>
        </p>
      )}
      {applied && <p className="status-msg">You've applied to this role — check "My Applications" for status updates.</p>}
      {!user && <p>Log in as a candidate to apply.</p>}
    </div>
  );
}
