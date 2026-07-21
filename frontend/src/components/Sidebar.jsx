import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  explore: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
    </svg>
  ),
  referrals: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  ),
  earnings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  ),
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
};

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `side-item ${isActive ? 'active' : ''}`}>
      {icons[icon]}
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <NavLink to="/" className="side-logo">M</NavLink>

      <nav className="side-nav">
        <NavItem to="/explore" icon="explore" label="Explore" />
        {user?.role === 'candidate' && (
          <>
            <NavItem to="/home" icon="home" label="Home" />
            <NavItem to="/referrals" icon="referrals" label="Referrals" />
            <NavItem to="/earnings" icon="earnings" label="Earnings" />
          </>
        )}
        {user?.role === 'recruiter' && (
          <NavItem to="/dashboard" icon="dashboard" label="Dashboard" />
        )}
        <NavItem to="/profile" icon="profile" label="Profile" />
      </nav>

      <div className="side-bottom">
        {user ? (
          <button
            className="side-item side-logout"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log out</span>
          </button>
        ) : (
          <>
            <NavLink to="/register" className="side-item side-cta">
              <span>Sign up</span>
            </NavLink>
            <NavLink to="/login" className="side-item">
              <span>Log in</span>
            </NavLink>
          </>
        )}
      </div>
    </aside>
  );
}
