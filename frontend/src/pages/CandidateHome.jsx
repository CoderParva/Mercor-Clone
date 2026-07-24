import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TABS = ['Contracts', 'Offers', 'Applications', 'Assessments', 'Saved'];

export default function CandidateHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Applications');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/applications/mine')
      .then((res) => setApplications(res.data.applications))
      .finally(() => setLoading(false));
  }, []);

  const linkedinHref = `${import.meta.env.VITE_API_URL || '/api'}/auth/linkedin?role=candidate`;

  const tasks = [
    {
      key: 'phone',
      done: !!user?.phoneVerified,
      title: 'Verify your phone number',
      body: 'You must have a valid phone number to use TalentMarket.',
      cta: 'Verify now',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'resume',
      done: !!user?.title,
      title: 'Complete your profile',
      body: 'A complete profile boosts your chances of being matched with opportunities.',
      cta: 'Complete now',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'linkedin',
      done: user?.authProvider === 'linkedin',
      title: 'Link LinkedIn',
      body: 'Linking boosts your chances of being matched with opportunities.',
      cta: 'Link now',
      href: linkedinHref, // full-page redirect rather than a React navigation
    },
  ];
  const pendingTasks = tasks.filter((t) => !t.done);

  return (
    <div className="page">
      <h1>Welcome back, {user?.name?.split(' ')[0] || 'there'}!</h1>

      {pendingTasks.length > 0 && (
        <>
          <p className="section-label">Important tasks ({pendingTasks.length})</p>
          <div className="task-grid">
            {pendingTasks.map((t) => (
              <div className="task-card" key={t.key}>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
                {t.href ? (
                  <a href={t.href} className="btn primary small">{t.cta}</a>
                ) : (
                  <button className="btn primary small" onClick={t.onClick}>{t.cta}</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="explore-tabs" style={{ marginTop: '2rem' }}>
        {TABS.map((t) => (
          <button
            key={t}
            className={`explore-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Applications' ? (
        loading ? (
          <p className="center-msg">Loading...</p>
        ) : (
          <div className="applications-list">
            <p className="section-label">Past applications ({applications.length})</p>
            {applications.map((app) => (
              <div className="application-row" key={app._id}>
                <div className="application-icon">📋</div>
                <div className="application-info">
                  <strong>{app.job?.title}</strong>
                  <span>
                    ${app.job?.payMin}-${app.job?.payMax} &middot; {app.job?.category}
                  </span>
                </div>
                <span className="application-date">
                  Submitted on {new Date(app.createdAt).toLocaleDateString()}
                </span>
                <span className={`badge ${app.status}`}>{app.status}</span>
              </div>
            ))}
            {applications.length === 0 && <p className="center-msg">You haven't applied to any roles yet.</p>}
          </div>
        )
      ) : (
        <p className="center-msg">Nothing here yet.</p>
      )}
    </div>
  );
}