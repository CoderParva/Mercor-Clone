import { useEffect, useState } from 'react';
import api from '../api/axios';
import JobCard from '../components/JobCard';
import { JobGridSkeleton } from '../components/Skeleton';
import AnimatedCounter from '../components/AnimatedCounter';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/jobs')
      .then((res) => setJobs(res.data.jobs.slice(0, 6)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="hero">
        <h1>Shape the frontier of AI</h1>
        <p>Connecting elite talent with the world's leading AI companies.</p>
        <div className="hero-actions">
          <Link to="/explore" className="btn primary">Start working</Link>
          <Link to="/register" className="btn secondary">Learn more</Link>
        </div>
      </section>

      <section className="stats-bar">
        <div>
          <AnimatedCounter target={85} prefix="$" suffix="/hr" />
          <span>Average contracted rate</span>
        </div>
        <div>
          <AnimatedCounter target={50} suffix="k+" />
          <span>Roles created</span>
        </div>
        <div>
          <AnimatedCounter target={2} prefix="$" suffix="M+" />
          <span>Daily payouts</span>
        </div>
      </section>

      <section className="latest-roles">
        <h2>Latest roles</h2>
        {loading ? (
          <JobGridSkeleton count={6} />
        ) : (
          <>
            <div className="job-grid">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
            {jobs.length === 0 && <p>No open roles yet — check back soon.</p>}
          </>
        )}
      </section>
    </div>
  );
}
