const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const { getTeamFixtures, getTeamStats, searchTeams } = require('../services/apiFootball');

// GET /api/teams/search?name=Manchester
router.get('/search', cacheMiddleware(600), async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'name query param required' });
    const teams = await searchTeams(name);
    res.json({ success: true, data: teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teams/:id/form?last=5
router.get('/:id/form', cacheMiddleware(300), async (req, res) => {
  try {
    const last = parseInt(req.query.last) || 5;
    const fixtures = await getTeamFixtures(req.params.id, last);

    // Build form string e.g. W-D-L-W-W
    const form = fixtures.map(f => {
      const home = f.teams.home.id === parseInt(req.params.id);
      const goals = f.goals;
      if (goals.home === null) return 'N';
      const teamGoals = home ? goals.home : goals.away;
      const oppGoals = home ? goals.away : goals.home;
      if (teamGoals > oppGoals) return 'W';
      if (teamGoals === oppGoals) return 'D';
      return 'L';
    }).reverse();

    res.json({ success: true, data: fixtures, form, formString: form.join('-') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teams/:id/stats?league=39&season=2024
router.get('/:id/stats', cacheMiddleware(600), async (req, res) => {
  try {
    const { league, season = new Date().getFullYear() } = req.query;
    if (!league) return res.status(400).json({ error: 'league query param required' });
    const stats = await getTeamStats(req.params.id, league, season);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
