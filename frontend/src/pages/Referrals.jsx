import { useState } from 'react';

const STAGES = [
  { key: 'signedUp', label: 'Signed Up' },
  { key: 'started', label: 'Application Started' },
  { key: 'completed', label: 'Application Completed' },
  { key: 'offer', label: 'Offer Extended' },
  { key: 'hired', label: 'Hired' },
  { key: 'paid', label: 'Paid' },
];

export default function Referrals() {
  const [activeStage, setActiveStage] = useState('signedUp');
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}/register?ref=demo`;

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
    <div className="page">
      <h1>Referrals</h1>
      <p className="section-label">Track your referral earnings and progress</p>

      <div className="stage-cards">
        {STAGES.map((s) => (
          <div
            key={s.key}
            className={`stage-card ${activeStage === s.key ? 'active' : ''}`}
            onClick={() => setActiveStage(s.key)}
          >
            <span className="stage-label">{s.label}</span>
            <strong>0</strong>
          </div>
        ))}
      </div>

      <div className="empty-referrals">
        <div className="empty-icon">👥</div>
        <h3>You don't have any referrals yet</h3>
        <p>All your referrals will be visible here</p>
        <button className="btn primary" onClick={copyLink}>
          {copied ? 'Link copied!' : 'Share your referral link'}
        </button>
      </div>
    </div>
  );
}
