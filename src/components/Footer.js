import React from 'react';

export function FooterSimple() {
  return (
    <div id="footer-simple" className="comic-footer-simple">
      <div className="comic-confidential-small">
        {'// METABUZZ OPERATIONS // CLASSIFIED INTEL'}
      </div>
      <div className="footer-links">
        Built for live speed &bull; Powered by{' '}
        <span className="gold-text">MetaBuzz Engine</span> &bull;{' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/wsun/multibuzzer"
          className="comic-footer-link"
        >
          Open Source Core
        </a>
      </div>
    </div>
  );
}

/**
 * Footer component
 * @param {bool} mobileOnly - only display on mobile devices, <768 px
 */
export default function Footer({ mobileOnly = false }) {
  return (
    <footer
      className={`metabuzz-footer ${mobileOnly ? 'd-block d-md-none' : ''}`}
    >
      <div className="comic-footer-container">
        <div className="comic-footer-skyline-accent" />
        <div className="comic-confidential-tag">
          {'// CONFIDENTIAL: LEVEL 5 // METABUZZ HIGH-VELOCITY PROTOCOL //'}
        </div>
        <p className="copyright-text">
          &copy; {new Date().getFullYear()} <strong>MetaBuzz</strong>. All
          rights reserved. Built for competitive coding, hackathons &amp;
          high-stakes trivia.
        </p>
      </div>
    </footer>
  );
}
