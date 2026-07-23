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
    <div className="page auth-page">
      <h1>Get started</h1>
      <form onSubmit={submit}>
        <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <label>
          I am a:
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </label>
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="auth-divider"><span>Or continue with</span></div>
      <p className="resume-hint" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        Signing up as: <strong>{form.role}</strong> (change the dropdown above first if needed)
      </p>
      <GoogleLoginButton role={form.role} />

      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}