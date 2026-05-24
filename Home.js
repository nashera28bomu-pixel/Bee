import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLiveMatches, getMatchesToday } from '../utils/api';
import MatchCard from '../components/MatchCard';
import './Home.css';

const Home = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [liveRes, todayRes] = await Promise.all([
          getLiveMatches(),
          getMatchesToday()
        ]);
        setLiveMatches(liveRes.data.data || []);
        setTodayMatches(todayRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(() => getLiveMatches().then(r => setLiveMatches(r.data.data || [])), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-text">EDGE</div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge badge-live">LIVE</span>
              <span>Football Intelligence Platform</span>
            </div>
            <h1 className="hero-title">
              Football Analytics<br />
              <span className="hero-title-accent">Like No Other</span>
            </h1>
            <p className="hero-subtitle">
              xG, corners, form, head-to-head, goal scorers and live odds — all in one place.
            </p>
            <div className="hero-cta">
              <Link to="/matches" className="btn-primary">Today's Matches</Link>
              <Link to="/h2h" className="btn-secondary">Head to Head</Link>
              <Link to="/odds" className="btn-secondary">Live Odds</Link>
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-value">{liveMatches.length}</div>
              <div className="stat-label">Live Now</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">{todayMatches.length}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">40+</div>
              <div className="stat-label">Bookmakers</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">900+</div>
              <div className="stat-label">Leagues</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <span className="badge badge-live">LIVE</span>
                Live Matches
              </h2>
              <Link to="/matches" className="see-all">See all →</Link>
            </div>
            <div className="matches-grid">
              {liveMatches.slice(0, 6).map(m => (
                <MatchCard key={m.fixture.id} match={m} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Today's Matches */}
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Today's Fixtures</h2>
            <Link to="/matches" className="see-all">See all →</Link>
          </div>
          {loading ? (
            <div className="loading-spinner">Loading fixtures...</div>
          ) : todayMatches.length === 0 ? (
            <div className="empty-state">No fixtures scheduled today.</div>
          ) : (
            <div className="matches-grid">
              {todayMatches.slice(0, 9).map(m => (
                <MatchCard key={m.fixture.id} match={m} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature cards */}
      <section className="home-section features-section">
        <div className="container">
          <h2 className="section-title">What CymorEdge Offers</h2>
          <div className="features-grid">
            {[
              { icon: '⚡', title: 'Expected Goals (xG)', desc: 'See the xG for every match — understand who deserved to win, not just who did.' },
              { icon: '📊', title: 'Corners & Stats', desc: 'Complete stats: corners, shots, possession, cards, passes and more.' },
              { icon: '🔁', title: 'Head to Head', desc: 'Full H2H history including goal scorers from past meetings.' },
              { icon: '📈', title: 'Recent Form', desc: 'Visual W/D/L form guide for both teams going into every match.' },
              { icon: '💰', title: 'Live Odds', desc: 'Best odds from 40+ bookmakers updated every minute.' },
              { icon: '🎯', title: 'AI Predictions', desc: 'Match predictions powered by statistical models and recent form.' },
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
