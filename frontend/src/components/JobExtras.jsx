import { useEffect, useState } from 'react';
import api from '../api/axios';

// Shared across the split-pane detail view and the standalone job page.
// onSelectSimilar lets each parent decide what "clicking a similar job" means —
// switch the panel in split view, or navigate to a new page on the standalone view.
export default function JobExtras({ job, onSelectSimilar }) {
  const [similar, setSimilar] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!job?._id) return;
    api
      .get(`/jobs/${job._id}/similar`)
      .then((res) => setSimilar(res.data.jobs))
      .catch(() => setSimilar([]));
  }, [job?._id]);

  if (!job) return null;

  const companyName = job.postedBy?.companyName || job.postedBy?.name || 'this company';
  const referralLink = `${window.location.origin}/register?ref=job-${job._id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access can fail in insecure contexts; fail silently
    }
  };

  return (
    <>
      <div className="jd-section">
        <h3>About {companyName}</h3>
        <p className="jd-overview">
          {job.postedBy?.bio ||
            `${companyName} is hiring for this role through TalentMarket. Contributors work directly with the team and get paid competitively for their expertise.`}
        </p>
      </div>

      {job.referralAmount > 0 && (
        <div className="jd-section referral-box">
          <h3>Earn up to ${job.referralAmount} by referring</h3>
          <p className="jd-overview">
            Share this link — earn up to ${job.referralAmount} for each successful referral hired for this role.
          </p>
          <div className="referral-link-row">
            <span className="referral-link-text">{referralLink}</span>
            <button type="button" className="btn secondary small" onClick={copyLink}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div className="jd-section">
          <h3>Similar opportunities</h3>
          <div className="similar-jobs-row">
            {similar.map((s) => (
              <button
                key={s._id}
                type="button"
                className="similar-job-card"
                onClick={() => onSelectSimilar(s._id)}
              >
                <strong>{s.title}</strong>
                <span className="pay">
                  {s.payMin === s.payMax ? `$${s.payMin}` : `$${s.payMin} - $${s.payMax}`} / hour
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}