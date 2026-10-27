import { useState } from 'react';
import './ContactUs.css';

const TARGET_EMAIL = 'saktheaa@gmail.com';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(TARGET_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, subject, message } = formData;

    const emailSubject = encodeURIComponent(`[PrepToGo] ${subject} from ${name || 'User'}`);
    const emailBody = encodeURIComponent(
      `Name: ${name || 'Not provided'}\nEmail: ${email || 'Not provided'}\n\nMessage:\n${message}\n\n---\nSent from PrepToGo Web App`
    );

    // Open user's email client directly with pre-filled content to saktheaa@gmail.com
    window.location.href = `mailto:${TARGET_EMAIL}?subject=${emailSubject}&body=${emailBody}`;
    setSubmitted(true);
  };

  return (
    <div className="contact-page">
      <header className="contact-header">
        <h1>Contact Us</h1>
        <p>
          Have questions, custom nail art inquiries, or stylist feedback?
          Reach out directly to us at <strong>{TARGET_EMAIL}</strong>.
        </p>
      </header>

      <div className="contact-grid">
        {/* ── Left Column: Direct Email Contact Card ── */}
        <section className="contact-info-card">
          <div className="contact-card-icon">
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="28" height="20" rx="4" stroke="url(#mailGrad)" strokeWidth="2.2" fill="none"/>
              <path d="M4 12l14 9 14-9" stroke="url(#mailGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <defs>
                <linearGradient id="mailGrad" x1="4" y1="8" x2="32" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#c9919c"/>
                  <stop offset="100%" stopColor="#c9a96e"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h2>Get in Touch</h2>
          <p className="contact-subtext">
            Our luxury studio team is always happy to collaborate, troubleshoot, or hear your beauty ideas.
          </p>

          {/* Email Highlight Box */}
          <div className="email-display-box">
            <span className="email-label">Official Contact Email</span>
            <a href={`mailto:${TARGET_EMAIL}`} className="email-link" title="Click to email saktheaa@gmail.com">
              {TARGET_EMAIL}
            </a>
            <div className="email-actions">
              <a
                href={`mailto:${TARGET_EMAIL}?subject=PrepToGo%20Inquiry`}
                className="direct-mail-btn"
              >
                ✉️ Send Email
              </a>
              <button
                type="button"
                className="copy-email-btn"
                onClick={handleCopyEmail}
                title="Copy email to clipboard"
              >
                {copied ? '✓ Copied!' : '📋 Copy Address'}
              </button>
            </div>
          </div>

          {/* Support Inquiries Info */}
          <div className="support-list">
            <div className="support-item">
              <span className="support-icon">💅</span>
              <div>
                <strong>NailAR Consultations</strong>
                <p>Custom polish shaders, high-gloss textures, and shape advice.</p>
              </div>
            </div>

            <div className="support-item">
              <span className="support-icon">👗</span>
              <div>
                <strong>ClawsFit Stylist AI</strong>
                <p>Personalized wardrobe recommendations and weather coordination.</p>
              </div>
            </div>

            <div className="support-item">
              <span className="support-icon">⚡</span>
              <div>
                <strong>Quick Response</strong>
                <p>Messages to {TARGET_EMAIL} are typically answered within 24 hours.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Column: Interactive Message Form ── */}
        <section className="contact-form-card">
          <div className="form-card-header">
            <h3>Send a Message</h3>
            <span className="form-badge">Direct to {TARGET_EMAIL}</span>
          </div>

          {submitted ? (
            <div className="submission-success-banner">
              <span className="success-icon">✨</span>
              <h4>Email Client Opened!</h4>
              <p>
                We have drafted your message to <strong>{TARGET_EMAIL}</strong>. If your email client didn't open automatically, you can email us directly at:
              </p>
              <a href={`mailto:${TARGET_EMAIL}`} className="fallback-mailto">
                {TARGET_EMAIL}
              </a>
              <button
                type="button"
                className="reset-form-btn"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="contact-field">
                  <label htmlFor="contactName">Your Name</label>
                  <input
                    id="contactName"
                    name="name"
                    type="text"
                    placeholder="e.g. Elena Rostova"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="contactEmail">Your Email</label>
                  <input
                    id="contactEmail"
                    name="email"
                    type="email"
                    placeholder="e.g. elena@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="contact-field">
                <label htmlFor="contactSubject">Inquiry Topic</label>
                <select
                  id="contactSubject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="NailAR Virtual Try-On Question">NailAR Virtual Try-On Question</option>
                  <option value="ClawsFit Stylist & Wardrobe Feedback">ClawsFit Stylist &amp; Wardrobe Feedback</option>
                  <option value="Collaboration or Partnership">Collaboration or Partnership</option>
                  <option value="Technical Support">Technical Support / Bug Report</option>
                </select>
              </div>

              <div className="contact-field">
                <label htmlFor="contactMessage">Message</label>
                <textarea
                  id="contactMessage"
                  name="message"
                  rows="5"
                  placeholder="Tell us what's on your mind, request features, or ask a question..."
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <button type="submit" className="submit-contact-btn">
                <span>✉️</span> Contact {TARGET_EMAIL}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
