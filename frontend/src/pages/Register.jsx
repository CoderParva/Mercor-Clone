import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      showToast('Account created', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-centered-wrap">
      <div className="auth-card">
        <div className="auth-logo">M</div>
        <h1 className="auth-card-title">Get started with TalentMarket</h1>

        <form onSubmit={submit}>
          <label className="auth-field-label">Full name</label>
          <input
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <label className="auth-field-label">Email address</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <label className="auth-field-label">Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <label className="auth-field-label">I am a</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>

          <button type="submit" className="btn primary auth-main-btn" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-divider"><span>Or continue with</span></div>
        <p className="resume-hint" style={{ marginBottom: '0.5rem' }}>
          Signing up as <strong>{form.role}</strong> — change the dropdown above first if needed.
        </p>
        <GoogleLoginButton role={form.role} />

        <p className="auth-switch-line">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>

      <p className="auth-terms-note">
        By signing up, you agree to our <a href="#">Terms of Service</a>.
      </p>
    </div>
  );
}