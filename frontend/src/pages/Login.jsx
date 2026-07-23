import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-centered-wrap">
      <div className="auth-card">
        <div className="auth-logo">M</div>
        <h1 className="auth-card-title">Continue to TalentMarket</h1>

        <form onSubmit={submit}>
          <label className="auth-field-label">Email address</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="auth-field-label">Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn primary auth-main-btn" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <Link to="/register" className="btn secondary auth-main-btn auth-signup-btn">Sign up</Link>

        <div className="auth-divider"><span>Or continue with</span></div>
        <GoogleLoginButton />
      </div>

      <p className="auth-terms-note">
        By signing in, you agree to our <a href="#">Terms of Service</a>.
      </p>
    </div>
  );
}