// LinkedIn's OAuth flow is a full-page redirect, not a JS button like Google's —
// clicking this takes you away from the site entirely, then LinkedIn redirects
// back to our backend's callback route, which finally redirects to /oauth/callback.
export default function LinkedInLoginButton({ role = 'candidate' }) {
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const href = `${apiBase}/auth/linkedin?role=${role}`;

  return (
    <a href={href} className="btn secondary linkedin-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.58 0 4.24 2.36 4.24 5.42v6.32zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/>
      </svg>
      Continue with LinkedIn
    </a>
  );
}