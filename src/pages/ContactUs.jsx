import './ContactUs.css';

export default function ContactUs() {
  return (
    <div className="contact-page">
      <header className="contact-header">
        <h1>Contact Us</h1>
        <p>Have questions, feedback, or just want to say hello? We'd love to hear from you.</p>
      </header>

      <div className="contact-content">
        {/* Placeholder — user will provide full content later */}
        <div className="contact-card">
          <div className="contact-card-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="28" height="20" rx="4" stroke="url(#mailGrad)" strokeWidth="2" fill="none"/>
              <path d="M4 12l14 9 14-9" stroke="url(#mailGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <defs>
                <linearGradient id="mailGrad" x1="4" y1="8" x2="32" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#c9919c"/>
                  <stop offset="100%" stopColor="#c9a96e"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2>Get In Touch</h2>
          <p className="contact-card-sub">
            This page is under construction. Instructions for full content coming soon.
          </p>
          <div className="contact-soon-badge">
            <span className="pulse-dot" />
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
