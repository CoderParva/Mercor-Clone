import { Link } from 'react-router-dom';

export default function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job._id}`} className="job-card">
      <div className="job-card-top">
        <h3>{job.title}</h3>
        {job.hiresCount > 0 && (
          <span className="hires-badge">{job.hiresCount} hired recently</span>
        )}
      </div>
      <p className="pay">${job.payMin}-${job.payMax}/hr</p>
      <p className="category">{job.category}</p>
      {job.skills?.length > 0 && (
        <div className="skill-tags">
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className="skill-tag">{s}</span>
          ))}
          {job.skills.length > 4 && <span className="skill-tag more">+{job.skills.length - 4}</span>}
        </div>
      )}
    </Link>
  );
}
