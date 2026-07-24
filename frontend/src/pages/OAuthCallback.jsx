import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Landing point after a redirect-based OAuth flow (LinkedIn) hands back a token
// via the URL. Google's flow doesn't need this — it hands the token straight to
// the button's JS callback instead of doing a full-page redirect.
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      showToast('Sign-in failed — no token received', 'error');
      navigate('/login');
      return;
    }
    localStorage.setItem('token', token);
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        showToast('Signed in', 'success');
        navigate('/');
      })
      .catch(() => {
        localStorage.removeItem('token');
        showToast('Sign-in failed', 'error');
        navigate('/login');
      });
  }, [params, navigate, setUser, showToast]);

  return <p className="center-msg">Finishing sign-in...</p>;
}