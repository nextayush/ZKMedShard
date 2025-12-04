import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';

export default function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show nav on login page usually, or show simplified version
  if (isLoginPage) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="nav-logo">
          ZKMedShard
        </Link>
        
        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Dashboard
          </Link>
          <Link to="/doctor" className={location.pathname === '/doctor' ? 'active' : ''}>
            Verify Claims
          </Link>
          <button 
            onClick={handleLogout} 
            className="btn btn-outline" 
            style={{ marginLeft: '1.5rem', padding: '0.4rem 1rem' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}