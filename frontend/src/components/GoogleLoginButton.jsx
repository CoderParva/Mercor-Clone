import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Renders Google's official "Sign in with Google" button using Google Identity
// Services (loaded via <script> in index.html). On success, sends the returned
// ID token to our backend, which verifies it and issues our own JWT.
export default function GoogleLoginButton({ role }) {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      // Silently no-op if not configured — the rest of the app (email/password)
      // still works fine without Google login set up.
      return;
    }
    if (!window.google?.accounts?.id) {
      // Script tag may not have finished loading yet; try again shortly.
      const timeout = setTimeout(() => {
        if (window.google?.accounts?.id) initGoogle();
      }, 500);
      return () => clearTimeout(timeout);
    }
    initGoogle();

    function initGoogle() {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const res = await api.post('/auth/google', { credential: response.credential, role });
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            showToast('Signed in with Google', 'success');
            navigate('/');
          } catch (err) {
            showToast(err.response?.data?.message || 'Google sign-in failed', 'error');
          }
        },
      });
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
        });
      }
    }
  }, [role, navigate, setUser, showToast]);

  const configured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!configured) return null;

  return <div ref={buttonRef} className="google-btn-wrap" />;
}