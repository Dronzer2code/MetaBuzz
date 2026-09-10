import React from 'react';
import { isNil } from 'lodash';
import { useHistory, useLocation } from 'react-router';
import { leaveRoom } from '../lib/endpoints';

export function MetaBuzzLogo({ onClick }) {
  return (
    <div
      className="metabuzz-badge-logo"
      onClick={onClick}
      role="button"
      tabIndex={0}
      title="MetaBuzz Home"
    >
      <div className="badge-emblem">
        <svg
          viewBox="0 0 40 40"
          className="emblem-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="40" height="40" rx="6" fill="#141414" />
          <path d="M8 32V8L18 22L22 14L16 32H8Z" fill="#F5C842" />
          <path d="M20 32L32 8V32H25V18L21 26L20 32Z" fill="#FFFFFF" />
          <circle cx="30" cy="12" r="3" fill="#F5C842" />
        </svg>
      </div>
      <div className="badge-text">
        <span className="badge-meta">META</span>
        <span className="badge-buzz">BUZZ</span>
      </div>
    </div>
  );
}

export default function Header({
  auth = {},
  clearAuth,
  sound = null,
  setSound,
  inGame = false,
}) {
  const history = useHistory();
  const location = useLocation();

  // leave current game
  async function leave() {
    try {
      await leaveRoom(auth.roomID, auth.playerID, auth.credentials);
      if (clearAuth) clearAuth();
      history.push('/');
    } catch (error) {
      console.log('leave error', error);
      if (clearAuth) clearAuth();
      history.push('/');
    }
  }

  const handleLogoClick = () => {
    if (location.pathname !== '/') {
      history.push('/');
    }
  };

  return (
    <header className="metabuzz-header">
      <div className="header-container">
        {/* Logo Badge */}
        <MetaBuzzLogo onClick={handleLogoClick} />

        {/* Right Controls */}
        <div className="header-controls">
          {!isNil(sound) ? (
            <button
              type="button"
              className="comic-nav-sound-btn"
              onClick={() => setSound()}
              title="Toggle Audio Feedback"
            >
              {sound ? '🔊 SOUND ON' : '🔇 SOUND OFF'}
            </button>
          ) : null}

          {clearAuth && inGame ? (
            <button
              type="button"
              className="comic-nav-leave-btn"
              onClick={() => leave()}
            >
              EXIT ARENA
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
