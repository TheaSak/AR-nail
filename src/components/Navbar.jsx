import { NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      {/* ── Brand / Logo ── */}
      <NavLink to="/" className="brand">
        <div className="brand-logo">
          {/* Claw / paw SVG logo */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Palm */}
            <ellipse cx="16" cy="20" rx="8" ry="7" fill="url(#palmGrad)" />
            {/* Fingers */}
            <ellipse cx="9"  cy="13" rx="3.2" ry="4.5" fill="url(#palmGrad)" transform="rotate(-15 9 13)" />
            <ellipse cx="13.5" cy="10.5" rx="3" ry="4.8" fill="url(#palmGrad)" transform="rotate(-5 13.5 10.5)" />
            <ellipse cx="18.5" cy="10.5" rx="3" ry="4.8" fill="url(#palmGrad)" transform="rotate(5 18.5 10.5)" />
            <ellipse cx="23" cy="13" rx="3.2" ry="4.5" fill="url(#palmGrad)" transform="rotate(15 23 13)" />
            {/* Nail tips — shiny accents */}
            <ellipse cx="9"  cy="9.2" rx="2" ry="2.5" fill="url(#nailGrad)" transform="rotate(-15 9 9.2)" />
            <ellipse cx="13.5" cy="6.5" rx="1.9" ry="2.5" fill="url(#nailGrad)" transform="rotate(-5 13.5 6.5)" />
            <ellipse cx="18.5" cy="6.5" rx="1.9" ry="2.5" fill="url(#nailGrad)" transform="rotate(5 18.5 6.5)" />
            <ellipse cx="23" cy="9.2" rx="2" ry="2.5" fill="url(#nailGrad)" transform="rotate(15 23 9.2)" />
            {/* Sparkle */}
            <circle cx="26" cy="6" r="1.2" fill="#c9a96e" opacity="0.9"/>
            <circle cx="6"  cy="7" r="0.8" fill="#c9a96e" opacity="0.7"/>
            <defs>
              <linearGradient id="palmGrad" x1="8" y1="8" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#d4a0ab" />
                <stop offset="100%" stopColor="#a85c6e" />
              </linearGradient>
              <linearGradient id="nailGrad" x1="8" y1="4" x2="24" y2="14" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffd6e0" />
                <stop offset="100%" stopColor="#ff8fa3" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="brand-name">ClawsOn</span>
      </NavLink>

      {/* ── Nav links ── */}
      <div className="nav-links">
        <NavLink to="/"         end className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>ClawTry</NavLink>
        <NavLink to="/clawcheck"    className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>ClawCheck</NavLink>
        <NavLink to="/contact"      className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Contact Us</NavLink>
      </div>
    </nav>
  );
}
