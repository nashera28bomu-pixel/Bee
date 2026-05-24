const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const {
  getFixtures,
  getLiveFixtures,
  getFixtureStats,
  getFixtureEvents,
  getPredictions
} = require('../services/apiFootball');

// GET /api/matches/live
router.get('/live', cacheMiddleware(60), async (req, res) => {
  try {
    const fixtures = await getLiveFixtures();
    res.json({ success: true, data: fixtures, count: fixtures.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/today
router.get('/today', cacheMiddleware(300), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const fixtures = await getFixtures({ date: today });
    res.json({ success: true, data: fixtures, count: fixtures.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/date/:date  (YYYY-MM-DD)
router.get('/date/:date', cacheMiddleware(300), async (req, res) => {
  try {
    const fixtures = await getFixtures({ date: req.params.date });
    res.json({ success: true, data: fixtures, count: fixtures.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:id/stats
router.get('/:id/stats', cacheMiddleware(120), async (req, res) => {
  try {
    const stats = await getFixtureStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:id/events
router.get('/:id/events', cacheMiddleware(60), async (req, res) => {
  try {
    const events = await getFixtureEvents(req.params.id);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:id/predictions
router.get('/:id/predictions', cacheMiddleware(600), async (req, res) => {
  try {
    const predictions = await getPredictions(req.params.id);
    res.json({ success: true, data: predictions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/league/:leagueId?season=2024
router.get('/league/:leagueId', cacheMiddleware(300), async (req, res) => {
  try {
    const { season = new Date().getFullYear(), round } = req.query;
    const params = { league: req.params.leagueId, season };
    if (round) params.round = round;
    const fixtures = await getFixtures(params);
    res.json({ success: true, data: fixtures, count: fixtures.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
