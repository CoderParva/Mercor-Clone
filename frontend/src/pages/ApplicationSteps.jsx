import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const STEP_ICONS = { phone: '☎', resume: '▤', workAuth: '⛨', interview: '▶' };

export default function ApplicationSteps() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState(null);

  const load = () => {
    api
      .get(`/applications/progress/${jobId}`)
      .then((res) => {
        setProgress(res.data);
        const firstIncomplete = res.data.steps.find((s) => !s.done);
        setActiveKey((k) => k || firstIncomplete?.key || res.data.steps[0]?.key);
      })
      .catch((err) => showToast(err.response?.data?.message || 'Could not load application', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <p className="center-msg">Loading application...</p>;
  if (!progress) return <p className="center-msg">Application unavailable.</p>;

  const activeStep = progress.steps.find((s) => s.key === activeKey) || progress.steps[0];

  return (
    <div className="page application-page">
      <div className="application-layout">
        <aside className="application-sidebar">
          <button className="link-btn" onClick={() => navigate('/explore')}>← Back to explore</button>

          <h2 className="application-job-title">{progress.job.title}</h2>
          <p className="application-pay">
            ${progress.job.payMin} - ${progress.job.payMax} / hour
          </p>

          <div className="application-progress-head">
            <span>{progress.completed} of {progress.total} steps done</span>
            <strong>{progress.percent}%</strong>
          </div>
          <div className="interview-progress-bar">
            <div className="interview-progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>

          <div className="application-step-list">
            {progress.steps.map((step) => (
              <button
                key={step.key}
                className={`application-step ${activeKey === step.key ? 'active' : ''} ${step.done ? 'done' : ''}`}
                onClick={() => setActiveKey(step.key)}
              >
                <span className="application-step-icon">{STEP_ICONS[step.key] || '•'}</span>
                <span className="application-step-label">
                  {step.label}
                  {step.core && <span className="core-tag">CORE</span>}
                </span>
                <span className={`application-step-check ${step.done ? 'done' : ''}`}>
                  {step.done ? '✓' : step.inProgress ? '◐' : ''}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="application-main">
          {activeStep && (
            <>
              <div className="application-main-head">
                <h1>{activeStep.label}</h1>
                {activeStep.done && <span className="step-done-badge">Completed</span>}
                {activeStep.inProgress && <span className="step-progress-badge">In progress</span>}
              </div>
              <p className="application-step-hint">{activeStep.hint}</p>

              {activeStep.key === 'interview' ? (
                <div className="application-cta-block">
                  <p>
                    This is a spoken AI interview. You'll hear each question read aloud, answer by
                    speaking, and the AI asks a follow-up based on what you actually said before moving on.
                  </p>
                  <ul className="jd-list">
                    <li>Takes roughly 10 minutes</li>
                    <li>Camera and microphone access required</li>
                    <li>Works best in Chrome or Edge</li>
                  </ul>
                  <Link to={`/jobs/${jobId}/interview`} className="btn primary">
                    {activeStep.done ? 'Retake interview' : activeStep.inProgress ? 'Resume interview' : 'Start interview'}
                  </Link>
                </div>
              ) : (
                <div className="application-cta-block">
                  <p>
                    {activeStep.done
                      ? 'This step is complete. You can update it any time from your profile.'
                      : 'Complete this in your profile — it carries across every role you apply to, so you only do it once.'}
                  </p>
                  <Link to="/profile" className="btn primary">
                    {activeStep.done ? 'Review in profile' : 'Complete in profile'}
                  </Link>
                </div>
              )}

              <p className="resume-hint application-reuse-note">
                Steps are shared across roles — once a step is done, it stays done for future applications.
              </p>
            </>
          )}
        </main>
      </div>

      <div className="application-footer">
        <button className="btn secondary" onClick={load}>Refresh status</button>
        <button
          className="btn primary"
          disabled={progress.completed < progress.total}
          onClick={() => {
            showToast('Application submitted', 'success');
            navigate('/home');
          }}
        >
          {progress.completed < progress.total
            ? `Complete all steps to submit (${progress.completed}/${progress.total})`
            : 'Submit application'}
        </button>
      </div>
    </div>
  );
}