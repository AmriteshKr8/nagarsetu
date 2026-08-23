import React from 'react';
import { CivicIllustration, ShieldIcon, LockIcon } from '../components/Icons';

export default function OfficerLogin() {
  return (
    <div className="friend-login-page">
      <div className="friend-main-container">
        <section className="friend-left-section">
          <div className="friend-illustration-wrapper">
            <CivicIllustration />
          </div>
          <h1 className="friend-title">CIVIC ACTION DASHBOARD</h1>
          <p className="friend-subtitle">
            Empowering better cities through<br />transparency, participation and progress
          </p>
        </section>

        <section className="friend-login-card">
          <div className="friend-shield">
            <ShieldIcon />
          </div>
          <h2 className="friend-login-title">Admin Login</h2>
          <p className="friend-login-description">
            Access this dashboard to manage and<br />monitor your city’s activities.
          </p>

          <form className="friend-form" onSubmit={(e) => e.preventDefault()}>
            <label className="friend-label">Email Address</label>
            <div className="friend-input-wrapper">
              <input type="email" placeholder="Enter your email address" className="friend-input" />
            </div>

            <label className="friend-label">Password</label>
            <div className="friend-input-wrapper">
              <div className="friend-lock-icon">
                <LockIcon />
              </div>
              <input type="password" placeholder="Enter your password" className="friend-password-input" />
            </div>

            <a href="#forgot-password" className="friend-forgot-password" onClick={(e) => e.preventDefault()}>
              Forget Password?
            </a>

            <button type="button" className="friend-login-button" onClick={() => window.open('/officer', '_blank')}>
              Login to Dashboard
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}