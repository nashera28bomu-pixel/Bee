import React, { useState } from 'react';
import { searchTeams, getH2H, getTeamForm } from '../utils/api';
import FormBadge from '../components/FormBadge';
import './H2H.css';

const H2H = () => {
  const [team1Query, setTeam1Query] = useState('');
  const [team2Query, setTeam2Query] = useState('');
  const [team1Results, setTeam1Results] = useState([]);
  const [team2Results, setTeam2Results] = useState([]);
  const [team1, setTeam1] = useState(null);
  const [team2, setTeam2] = useState(null);
  const [team1Form, setTeam1Form] = useState([]);
  const [team2Form, setTeam2Form] = useState([]);
  const [h2hData, setH2HData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchTeam = async (query, setResults) => {
    if (query.length < 2) return;
    try {
      const res = await searchTeams(query);
      setResults(res.data.data || []);
    } catch { }
  };

  const selectTeam = async (team, isTeam1) => {
    if (isTeam1) {
      setTeam1(team);
      setTeam1Query(team.team.name);
      setTeam1Results([]);
      const formRes = await getTeamForm(team.team.id, 6);
      setTeam1Form(formRes.data.form || []);
    } else {
      setTeam2(team);
      setTeam2Query(team.team.name);
      setTeam2Results([]);
      const formRes = await getTeamForm(team.team.id, 6);
      setTeam2Form(formRes.data.form || []);
    }
  };

  const runH2H = async () => {
    if (!team1 || !team2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getH2H(team1.team.id, team2.team.id, 10);
      setH2HData(res.data);
    } catch (e) {
      setError('Failed to load H2H data.');
    } finally {
      setLoading(false);
    }
  };

  const fixtures = h2hData?.data || [];
  const summary = h2hData?.summary;

  return (
    <div className="h2h-page">
      <div className="container">
        <h1 className="section-title">Head to Head</h1>
        <p className="page-subtitle">Compare two teams — form, history, goal scorers and more.</p>

        {/* Team Search */}
        <div className="h2h-search-grid">
          {/* Team 1 */}
          <div className="team-search-box">
            <label className="search-label">Home Team</label>
            <div className="search-input-wrap">
              <input
                type="text"
                className="team-search-input"
                placeholder="Search team..."
                value={team1Query}
                onChange={e => { setTeam1Query(e.target.value); searchTeam(e.target.value, setTeam1Results); }}
              />
              {team1Results.length > 0 && (
                <div className="search-dropdown">
                  {team1Results.slice(0, 6).map(t => (
                    <div key={t.team.id} className="search-result" onClick={() => selectTeam(t, true)}>
                      {t.team.logo && <img src={t.team.logo} alt={t.team.name} />}
                      <div>
                        <div className="result-name">{t.team.name}</div>
                        <div className="result-country">{t.team.country}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {team1 && (
              <div className="selected-team">
                <img src={team1.team.logo} alt={team1.team.name} className="selected-logo" />
                <div>
                  <div className="selected-name">{team1.team.name}</div>
                  <div className="form-label">Recent form:</div>
                  <FormBadge form={team1Form} size="md" />
                </div>
              </div>
            )}
          </div>

          <div className="vs-divider">
            <span>VS</span>
          </div>

          {/* Team 2 */}
          <div className="team-search-box">
            <label className="search-label">Away Team</label>
            <div className="search-input-wrap">
              <input
                type="text"
                className="team-search-input"
                placeholder="Search team..."
                value={team2Query}
                onChange={e => { setTeam2Query(e.target.value); searchTeam(e.target.value, setTeam2Results); }}
              />
              {team2Results.length > 0 && (
                <div className="search-dropdown">
                  {team2Results.slice(0, 6).map(t => (
                    <div key={t.team.id} className="search-result" onClick={() => selectTeam(t, false)}>
                      {t.team.logo && <img src={t.team.logo} alt={t.team.name} />}
                      <div>
                        <div className="result-name">{t.team.name}</div>
                        <div className="result-country">{t.team.country}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {team2 && (
              <div className="selected-team">
                <img src={team2.team.logo} alt={team2.team.name} className="selected-logo" />
                <div>
                  <div className="selected-name">{team2.team.name}</div>
                  <div className="form-label">Recent form:</div>
                  <FormBadge form={team2Form} size="md" />
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          className="h2h-btn"
          onClick={runH2H}
          disabled={!team1 || !team2 || loading}
        >
          {loading ? 'Loading...' : 'Analyse Head to Head →'}
        </button>

        {error && <div className="error-box" style={{ marginTop: 20 }}>{error}</div>}

        {/* Summary */}
        {summary && (
          <div className="h2h-summary animate-in">
            <div className="summary-stat">
              <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{summary.team1Wins}</div>
              <div className="stat-label">{team1?.team.name} Wins</div>
            </div>
            <div className="summary-stat">
              <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{summary.draws}</div>
              <div className="stat-label">Draws</div>
            </div>
            <div className="summary-stat">
              <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{summary.team2Wins}</div>
              <div className="stat-label">{team2?.team.name} Wins</div>
            </div>
            <div className="summary-stat">
              <div className="stat-value">{summary.avgGoals}</div>
              <div className="stat-label">Avg Goals/Game</div>
            </div>
          </div>
        )}

        {/* Top Scorers in H2H */}
        {summary?.topScorers?.length > 0 && (
          <div className="card animate-in" style={{ marginBottom: 24 }}>
            <h2 className="card-section-title">⚽ Top Scorers in These Fixtures</h2>
            <div className="scorers-list">
              {summary.topScorers.map((s, i) => (
                <div key={i} className="scorer-row">
                  <span className="scorer-rank">#{i + 1}</span>
                  <span className="scorer-name">{s.name}</span>
                  <span className="scorer-goals">{s.goals} goal{s.goals > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Fixtures */}
        {fixtures.length > 0 && (
          <div className="card animate-in">
            <h2 className="card-section-title">📋 Past Meetings (Last {fixtures.length})</h2>
            <div className="h2h-fixtures">
              {fixtures.map(f => {
                const home = f.teams.home;
                const away = f.teams.away;
                const goals = f.goals;
                const date = new Date(f.fixture.date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                });
                return (
                  <div key={f.fixture.id} className="h2h-fixture-row">
                    <span className="h2h-date">{date}</span>
                    <div className="h2h-teams">
                      <span className="h2h-team">{home.name}</span>
                      <span className="h2h-score">
                        {goals.home ?? '?'} – {goals.away ?? '?'}
                      </span>
                      <span className="h2h-team away">{away.name}</span>
                    </div>
                    <span className="h2h-league">{f.league.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default H2H;
