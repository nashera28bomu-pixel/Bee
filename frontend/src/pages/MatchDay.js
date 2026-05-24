import React, { useState, useEffect } from 'react';
import { getMatchesByDate } from '../utils/api';
import MatchCard from '../components/MatchCard';
import './MatchDay.css';

const MatchDay = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  const leagues = ['All', ...new Set(matches.map(m => m.league?.name).filter(Boolean))];

  const filtered = filter === 'All' ? matches : matches.filter(m => m.league?.name === filter);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMatchesByDate(date);
        setMatches(res.data.data || []);
      } catch (e) {
        setError('Failed to load matches.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date]);

  const shiftDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <div className="matchday-page">
      <div className="container">
        <div className="matchday-header">
          <h1 className="section-title">Match Center</h1>

          <div className="date-nav">
            <button className="date-btn" onClick={() => shiftDate(-1)}>← Prev</button>
            <div className="date-display">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="date-input"
              />
              <span className="date-label">{displayDate}</span>
            </div>
            <button className="date-btn" onClick={() => shiftDate(1)}>Next →</button>
          </div>
        </div>

        {/* League filter */}
        {leagues.length > 2 && (
          <div className="league-filter">
            {leagues.slice(0, 12).map(l => (
              <button
                key={l}
                className={`filter-chip ${filter === l ? 'active' : ''}`}
                onClick={() => setFilter(l)}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        <div className="match-count">
          <span className="mono-text">{filtered.length} match{filtered.length !== 1 ? 'es' : ''}</span>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="loading-spinner">Fetching fixtures...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No matches found for this date.</div>
        ) : (
          <div className="matches-grid">
            {filtered.map(m => (
              <MatchCard key={m.fixture.id} match={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDay;
