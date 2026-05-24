import React from 'react';
import { Link } from 'react-router-dom';
import './MatchCard.css';

const statusLabel = (fixture) => {
  const s = fixture.status;
  if (s.short === 'LIVE' || s.short === '1H' || s.short === '2H' || s.short === 'HT') {
    return <span className="badge badge-live">{s.elapsed ? `${s.elapsed}'` : 'LIVE'}</span>;
  }
  if (s.short === 'FT') return <span className="match-status ft">FT</span>;
  if (s.short === 'NS') {
    const time = new Date(fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return <span className="match-status upcoming">{time}</span>;
  }
  return <span className="match-status">{s.short}</span>;
};

const MatchCard = ({ match }) => {
  const { fixture, teams, goals, league } = match;
  const isLive = ['1H', '2H', 'HT', 'LIVE'].includes(fixture.status.short);
  const isFinished = fixture.status.short === 'FT';

  return (
    <Link to={`/match/${fixture.id}`} className={`match-card ${isLive ? 'live' : ''}`}>
      <div className="match-card-league">
        {league.flag && <img src={league.flag} alt={league.country} className="league-flag" />}
        <span>{league.name}</span>
        <span className="league-round">{league.round}</span>
      </div>

      <div className="match-card-body">
        <div className="team-row">
          <div className="team-info">
            {teams.home.logo && <img src={teams.home.logo} alt={teams.home.name} className="team-logo" />}
            <span className="team-name">{teams.home.name}</span>
          </div>
          <div className="score-block">
            {(isFinished || isLive) ? (
              <span className="score-value">{goals.home ?? '-'}</span>
            ) : (
              <span className="score-placeholder">—</span>
            )}
          </div>
        </div>

        <div className="match-separator">
          {statusLabel(fixture)}
        </div>

        <div className="team-row">
          <div className="team-info">
            {teams.away.logo && <img src={teams.away.logo} alt={teams.away.name} className="team-logo" />}
            <span className="team-name">{teams.away.name}</span>
          </div>
          <div className="score-block">
            {(isFinished || isLive) ? (
              <span className="score-value">{goals.away ?? '-'}</span>
            ) : (
              <span className="score-placeholder">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="match-card-footer">
        <span className="venue">{fixture.venue?.name}</span>
        <span className="view-details">View Analysis →</span>
      </div>
    </Link>
  );
};

export default MatchCard;
