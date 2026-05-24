const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const { getH2H } = require('../services/apiFootball');

router.get('/', cacheMiddleware(600), async (req, res) => {
  try {
    const { team1, team2, last = 10 } = req.query;
    if (!team1 || !team2) {
      return res.status(400).json({ error: 'team1 and team2 required' });
    }

    const fixtures = await getH2H(team1, team2, last);

    let team1Wins = 0, team2Wins = 0, draws = 0, totalGoals = 0;
    const scorers = {};

    fixtures.forEach(f => {
      const home = f.teams.home;
      const goals = f.goals;
      if (goals.home === null) return;
      totalGoals += goals.home + goals.away;

      if (goals.home > goals.away) {
        if (home.id === parseInt(team1)) team1Wins++;
        else team2Wins++;
      } else if (goals.away > goals.home) {
        if (home.id !== parseInt(team1)) team1Wins++;
        else team2Wins++;
      } else { draws++; }

      if (f.events) {
        f.events.forEach(event => {
          if (event.type === 'Goal' && event.player?.name) {
            const name = event.player.name;
            scorers[name] = (scorers[name] || 0) + 1;
          }
        });
      }
    });

    const topScorers = Object.entries(scorers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, goals]) => ({ name, goals }));

    res.json({
      success: true,
      data: fixtures,
      summary: { team1Wins, team2Wins, draws, totalMatches: fixtures.length,
        avgGoals: fixtures.length ? (totalGoals / fixtures.length).toFixed(2) : 0,
        topScorers }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
