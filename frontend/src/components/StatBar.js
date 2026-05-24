import React from 'react';
import './StatBar.css';

const StatBar = ({ label, home, away, homeColor, awayColor }) => {
  const total = parseFloat(home || 0) + parseFloat(away || 0);
  const homePercent = total > 0 ? (parseFloat(home) / total) * 100 : 50;
  const awayPercent = 100 - homePercent;

  return (
    <div className="stat-bar-row">
      <span className="stat-bar-value home">{home ?? '—'}</span>
      <div className="stat-bar-label-wrap">
        <span className="stat-bar-name">{label}</span>
        <div className="stat-bar-track">
          <div
            className="stat-bar-fill home-fill"
            style={{
              width: `${homePercent}%`,
              background: homeColor || 'var(--accent-green)'
            }}
          />
          <div
            className="stat-bar-fill away-fill"
            style={{
              width: `${awayPercent}%`,
              background: awayColor || 'var(--accent-blue)'
            }}
          />
        </div>
      </div>
      <span className="stat-bar-value away">{away ?? '—'}</span>
    </div>
  );
};

export default StatBar;
