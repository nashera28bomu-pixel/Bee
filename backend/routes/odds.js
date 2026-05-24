const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const { getOdds, getLiveOdds, SOCCER_SPORTS } = require('../services/oddsApi');

// GET /api/odds?league=Premier League&regions=uk,eu
router.get('/', cacheMiddleware(120), async (req, res) => {
  try {
    const { league = 'Premier League', regions = 'uk,eu', markets = 'h2h,totals' } = req.query;
    const sport = SOCCER_SPORTS[league] || 'soccer_epl';
    const odds = await getOdds(sport, regions, markets);
    res.json({ success: true, data: odds, league, sport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/odds/live?league=Premier League
router.get('/live', cacheMiddleware(30), async (req, res) => {
  try {
    const { league = 'Premier League', regions = 'uk,eu' } = req.query;
    const sport = SOCCER_SPORTS[league] || 'soccer_epl';
    const odds = await getLiveOdds(sport, regions);
    res.json({ success: true, data: odds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/odds/leagues - list supported leagues
router.get('/leagues', (req, res) => {
  res.json({ success: true, data: Object.keys(SOCCER_SPORTS) });
});

// GET /api/odds/match?home=Arsenal&away=Chelsea - find odds for a specific match
router.get('/match', cacheMiddleware(120), async (req, res) => {
  try {
    const { home, away, league = 'Premier League' } = req.query;
    if (!home || !away) return res.status(400).json({ error: 'home and away params required' });

    const sport = SOCCER_SPORTS[league] || 'soccer_epl';
    const allOdds = await getOdds(sport, 'uk,eu', 'h2h,totals,btts');

    const match = allOdds.find(game =>
      game.home_team.toLowerCase().includes(home.toLowerCase()) ||
      game.away_team.toLowerCase().includes(away.toLowerCase())
    );

    if (!match) return res.status(404).json({ error: 'Match not found in odds data' });

    // Format bookmakers
    const formatted = {
      matchId: match.id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      commenceTime: match.commence_time,
      bookmakers: match.bookmakers.map(b => ({
        name: b.title,
        markets: b.markets.map(m => ({
          key: m.key,
          outcomes: m.outcomes
        }))
      }))
    };

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
