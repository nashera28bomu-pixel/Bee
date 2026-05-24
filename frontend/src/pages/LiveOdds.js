import React, { useState, useEffect } from 'react';
import { getOdds, getOddsLeagues } from '../utils/api';
import OddsCard from '../components/OddsCard';
import './LiveOdds.css';

const LiveOdds = () => {
  const [odds, setOdds] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('Premier League');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    getOddsLeagues().then(r => setLeagues(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getOdds(selectedLeague);
        setOdds(res.data.data || []);
        setLastUpdated(new Date());
      } catch (e) {
        setError('Failed to load odds. Check your API key.');
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 120000);
    return () => clearInterval(interval);
  }, [selectedLeague]);

  return (
    <div className="odds-page">
      <div className="container">
        <div className="odds-header">
          <div>
            <h1 className="section-title">Live Odds</h1>
            {lastUpdated && (
              <p className="last-updated">
                Updated: {lastUpdated.toLocaleTimeString()} · Auto-refresh every 2min
              </p>
            )}
          </div>
          <div className="odds-controls">
            <select
              className="league-select"
              value={selectedLeague}
              onChange={e => setSelectedLeague(e.target.value)}
            >
              {leagues.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="odds-info-bar">
          <div className="info-item">
            <span className="info-val">{odds.length}</span>
            <span className="info-label">Matches</span>
          </div>
          <div className="info-item">
            <span className="info-val">40+</span>
            <span className="info-label">Bookmakers</span>
          </div>
          <div className="info-item">
            <span className="info-val">Best</span>
            <span className="info-label">Odds Highlighted</span>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="loading-spinner">Fetching odds...</div>
        ) : odds.length === 0 ? (
          <div className="empty-state">No odds available for this league right now.</div>
        ) : (
          <div className="odds-grid">
            {odds.map(match => (
              <OddsCard key={match.id} oddsData={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveOdds;
