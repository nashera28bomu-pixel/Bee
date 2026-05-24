import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTeamForm } from '../utils/api';
import FormBadge from '../components/FormBadge';
import MatchCard from '../components/MatchCard';
import './TeamForm.css';

const TeamForm = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamForm(id, 10)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-spinner">Loading team form...</div>;
  if (!data) return <div className="error-box">Could not load team data.</div>;

  const { form, formString, data: fixtures } = data;
  const team = fixtures?.[0]?.teams?.home?.id === parseInt(id)
    ? fixtures[0]?.teams?.home
    : fixtures?.[0]?.teams?.away;

  const wins = form.filter(r => r === 'W').length;
  const draws = form.filter(r => r === 'D').length;
  const losses = form.filter(r => r === 'L').length;

  return (
    <div className="team-form-page">
      <div className="container">
        {team && (
          <div className="team-form-header">
            {team.logo && <img src={team.logo} alt={team.name} className="tf-logo" />}
            <div>
              <h1 className="tf-name">{team.name}</h1>
              <div className="tf-form-row">
                <span className="form-label-text">Last {form.length} games:</span>
                <FormBadge form={form} size="lg" />
                <span className="form-string">{formString}</span>
              </div>
            </div>
          </div>
        )}

        <div className="tf-stats-bar">
          <div className="tf-stat">
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{wins}</div>
            <div className="stat-label">Wins</div>
          </div>
          <div className="tf-stat">
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{draws}</div>
            <div className="stat-label">Draws</div>
          </div>
          <div className="tf-stat">
            <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{losses}</div>
            <div className="stat-label">Losses</div>
          </div>
          <div className="tf-stat">
            <div className="stat-value">
              {((wins / (wins + draws + losses)) * 100).toFixed(0)}%
            </div>
            <div className="stat-label">Win Rate</div>
          </div>
        </div>

        <h2 className="section-title" style={{ marginBottom: 20 }}>Recent Matches</h2>
        <div className="matches-grid">
          {(fixtures || []).map(m => (
            <MatchCard key={m.fixture.id} match={m} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamForm;
