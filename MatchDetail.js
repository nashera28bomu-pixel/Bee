import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMatchStats, getMatchEvents, getMatchPredictions } from '../utils/api';
import StatBar from '../components/StatBar';
import './MatchDetail.css';

const MatchDetail = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, eventsRes, predRes] = await Promise.all([
          getMatchStats(id),
          getMatchEvents(id),
          getMatchPredictions(id)
        ]);
        setStats(statsRes.data.data);
        setEvents(eventsRes.data.data || []);
        setPredictions(predRes.data.data?.[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="loading-spinner">Loading match analysis...</div>;

  const homeStats = stats?.[0]?.statistics || [];
  const awayStats = stats?.[1]?.statistics || [];
  const homeTeam = stats?.[0]?.team;
  const awayTeam = stats?.[1]?.team;

  const getStat = (statsArr, type) => {
    const s = statsArr.find(s => s.type === type);
    return s?.value ?? null;
  };

  const statRows = [
    { label: 'Expected Goals (xG)', type: 'expected_goals' },
    { label: 'Ball Possession', type: 'Ball Possession' },
    { label: 'Total Shots', type: 'Total Shots' },
    { label: 'Shots on Goal', type: 'Shots on Goal' },
    { label: 'Corner Kicks', type: 'Corner Kicks' },
    { label: 'Fouls', type: 'Fouls' },
    { label: 'Yellow Cards', type: 'Yellow Cards' },
    { label: 'Red Cards', type: 'Red Cards' },
    { label: 'Offsides', type: 'Offsides' },
    { label: 'Total Passes', type: 'Total passes' },
    { label: 'Passes Accurate', type: 'Passes accurate' },
    { label: 'Goalkeeper Saves', type: 'Goalkeeper Saves' },
  ];

  const goals = events.filter(e => e.type === 'Goal');
  const cards = events.filter(e => e.type === 'Card');

  return (
    <div className="match-detail-page">
      <div className="container">

        {/* Header */}
        <div className="match-detail-header">
          {homeTeam && awayTeam && (
            <div className="detail-teams">
              <div className="detail-team">
                {homeTeam.logo && <img src={homeTeam.logo} alt={homeTeam.name} />}
                <span>{homeTeam.name}</span>
              </div>
              <div className="detail-vs">
                <span className="detail-vs-text">VS</span>
              </div>
              <div className="detail-team away">
                {awayTeam.logo && <img src={awayTeam.logo} alt={awayTeam.name} />}
                <span>{awayTeam.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          {['stats', 'events', 'prediction'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="card animate-in">
            <h2 className="card-title">Match Statistics</h2>
            {statRows.map(row => {
              const hVal = getStat(homeStats, row.type);
              const aVal = getStat(awayStats, row.type);
              if (hVal === null && aVal === null) return null;
              return (
                <StatBar
                  key={row.type}
                  label={row.label}
                  home={typeof hVal === 'string' ? hVal.replace('%', '') : hVal}
                  away={typeof aVal === 'string' ? aVal.replace('%', '') : aVal}
                />
              );
            })}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="animate-in">
            <div className="card" style={{ marginBottom: 16 }}>
              <h2 className="card-title">⚽ Goals</h2>
              {goals.length === 0 ? (
                <p className="no-data">No goals recorded</p>
              ) : (
                <div className="events-list">
                  {goals.map((g, i) => (
                    <div key={i} className="event-row">
                      <span className="event-minute">{g.time?.elapsed}'</span>
                      <span className="event-icon">⚽</span>
                      <span className="event-player">{g.player?.name}</span>
                      <span className="event-assist">{g.assist?.name && `↗ ${g.assist.name}`}</span>
                      <span className="event-team">{g.team?.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="card-title">🟨 Cards</h2>
              {cards.length === 0 ? (
                <p className="no-data">No cards recorded</p>
              ) : (
                <div className="events-list">
                  {cards.map((c, i) => (
                    <div key={i} className="event-row">
                      <span className="event-minute">{c.time?.elapsed}'</span>
                      <span className="event-icon">{c.detail === 'Red Card' ? '🟥' : '🟨'}</span>
                      <span className="event-player">{c.player?.name}</span>
                      <span className="event-team">{c.team?.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'prediction' && (
          <div className="card animate-in">
            <h2 className="card-title">🎯 Match Prediction</h2>
            {!predictions ? (
              <p className="no-data">No prediction data available</p>
            ) : (
              <div className="predictions-grid">
                {predictions.predictions && (
                  <>
                    <div className="pred-item">
                      <div className="pred-value">{predictions.predictions.winner?.name || '—'}</div>
                      <div className="pred-label">Predicted Winner</div>
                    </div>
                    <div className="pred-item">
                      <div className="pred-value">{predictions.predictions.win_or_draw ? 'Yes' : 'No'}</div>
                      <div className="pred-label">Win or Draw</div>
                    </div>
                    <div className="pred-item">
                      <div className="pred-value">{predictions.predictions.under_over || '—'}</div>
                      <div className="pred-label">Under/Over 2.5</div>
                    </div>
                    <div className="pred-item">
                      <div className="pred-value">{predictions.predictions.goals?.home} - {predictions.predictions.goals?.away}</div>
                      <div className="pred-label">Predicted Score</div>
                    </div>
                  </>
                )}

                {predictions.teams && (
                  <div className="team-comparison">
                    <h3>Team Comparison</h3>
                    <div className="comp-row">
                      <span>{predictions.teams.home?.league?.form || '—'}</span>
                      <span className="comp-label">League Form</span>
                      <span>{predictions.teams.away?.league?.form || '—'}</span>
                    </div>
                    <div className="comp-row">
                      <span>{predictions.teams.home?.league?.goals?.for?.average?.total || '—'}</span>
                      <span className="comp-label">Avg Goals Scored</span>
                      <span>{predictions.teams.away?.league?.goals?.for?.average?.total || '—'}</span>
                    </div>
                    <div className="comp-row">
                      <span>{predictions.teams.home?.league?.goals?.against?.average?.total || '—'}</span>
                      <span className="comp-label">Avg Goals Conceded</span>
                      <span>{predictions.teams.away?.league?.goals?.against?.average?.total || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetail;
