import React, { useState } from 'react';
import './OddsCard.css';

const OddsCard = ({ oddsData }) => {
  const [expanded, setExpanded] = useState(false);

  if (!oddsData) return null;

  // Get best odds across bookmakers for h2h market
  const getBestOdds = () => {
    let bestHome = 0, bestDraw = 0, bestAway = 0;
    let homeBook = '', drawBook = '', awayBook = '';

    oddsData.bookmakers?.forEach(b => {
      const h2h = b.markets?.find(m => m.key === 'h2h');
      if (!h2h) return;
      h2h.outcomes.forEach(o => {
        if (o.name === oddsData.home_team && o.price > bestHome) {
          bestHome = o.price;
          homeBook = b.title;
        }
        if (o.name === 'Draw' && o.price > bestDraw) {
          bestDraw = o.price;
          drawBook = b.title;
        }
        if (o.name === oddsData.away_team && o.price > bestAway) {
          bestAway = o.price;
          awayBook = b.title;
        }
      });
    });

    return { bestHome, bestDraw, bestAway, homeBook, drawBook, awayBook };
  };

  const best = getBestOdds();
  const matchTime = oddsData.commence_time
    ? new Date(oddsData.commence_time).toLocaleString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : '';

  return (
    <div className={`odds-card ${expanded ? 'expanded' : ''}`}>
      <div className="odds-card-header">
        <div className="odds-teams">
          <span className="odds-team home-team">{oddsData.home_team}</span>
          <span className="odds-vs">vs</span>
          <span className="odds-team away-team">{oddsData.away_team}</span>
        </div>
        {matchTime && <span className="odds-time">{matchTime}</span>}
      </div>

      <div className="odds-best-row">
        <div className="odds-option">
          <div className="odds-val home">{best.bestHome > 0 ? best.bestHome.toFixed(2) : '—'}</div>
          <div className="odds-label">Home</div>
          {best.homeBook && <div className="odds-book">{best.homeBook}</div>}
        </div>
        <div className="odds-option">
          <div className="odds-val draw">{best.bestDraw > 0 ? best.bestDraw.toFixed(2) : '—'}</div>
          <div className="odds-label">Draw</div>
          {best.drawBook && <div className="odds-book">{best.drawBook}</div>}
        </div>
        <div className="odds-option">
          <div className="odds-val away">{best.bestAway > 0 ? best.bestAway.toFixed(2) : '—'}</div>
          <div className="odds-label">Away</div>
          {best.awayBook && <div className="odds-book">{best.awayBook}</div>}
        </div>
      </div>

      <button className="odds-expand-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▲ Hide bookmakers' : `▼ All bookmakers (${oddsData.bookmakers?.length || 0})`}
      </button>

      {expanded && (
        <div className="odds-bookmakers">
          {oddsData.bookmakers?.map(b => {
            const h2h = b.markets?.find(m => m.key === 'h2h');
            if (!h2h) return null;
            const home = h2h.outcomes.find(o => o.name === oddsData.home_team);
            const draw = h2h.outcomes.find(o => o.name === 'Draw');
            const away = h2h.outcomes.find(o => o.name === oddsData.away_team);

            return (
              <div key={b.key} className="bookmaker-row">
                <span className="bookmaker-name">{b.title}</span>
                <div className="bookmaker-odds">
                  <span className={home?.price === best.bestHome ? 'best-price' : ''}>{home?.price?.toFixed(2) || '—'}</span>
                  <span className={draw?.price === best.bestDraw ? 'best-price' : ''}>{draw?.price?.toFixed(2) || '—'}</span>
                  <span className={away?.price === best.bestAway ? 'best-price' : ''}>{away?.price?.toFixed(2) || '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OddsCard;
