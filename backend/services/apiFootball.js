const axios = require('axios');

const apiFootball = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY
  }
});

// Get fixtures by date or league
const getFixtures = async (params = {}) => {
  const response = await apiFootball.get('/fixtures', { params });
  return response.data.response;
};

// Get live fixtures
const getLiveFixtures = async () => {
  const response = await apiFootball.get('/fixtures', { params: { live: 'all' } });
  return response.data.response;
};

// Get fixture statistics (xG, corners, shots etc)
const getFixtureStats = async (fixtureId) => {
  const response = await apiFootball.get('/fixtures/statistics', {
    params: { fixture: fixtureId }
  });
  return response.data.response;
};

// Get fixture events (goals, cards, subs)
const getFixtureEvents = async (fixtureId) => {
  const response = await apiFootball.get('/fixtures/events', {
    params: { fixture: fixtureId }
  });
  return response.data.response;
};

// Get head-to-head
const getH2H = async (team1Id, team2Id, last = 10) => {
  const response = await apiFootball.get('/fixtures/headtohead', {
    params: { h2h: `${team1Id}-${team2Id}`, last }
  });
  return response.data.response;
};

// Get team recent form (last N fixtures)
const getTeamFixtures = async (teamId, last = 5) => {
  const response = await apiFootball.get('/fixtures', {
    params: { team: teamId, last }
  });
  return response.data.response;
};

// Get team statistics for a season
const getTeamStats = async (teamId, leagueId, season) => {
  const response = await apiFootball.get('/teams/statistics', {
    params: { team: teamId, league: leagueId, season }
  });
  return response.data.response;
};

// Get top scorers for a league
const getTopScorers = async (leagueId, season) => {
  const response = await apiFootball.get('/players/topscorers', {
    params: { league: leagueId, season }
  });
  return response.data.response;
};

// Get predictions
const getPredictions = async (fixtureId) => {
  const response = await apiFootball.get('/predictions', {
    params: { fixture: fixtureId }
  });
  return response.data.response;
};

// Search teams
const searchTeams = async (name) => {
  const response = await apiFootball.get('/teams', { params: { search: name } });
  return response.data.response;
};

// Get leagues
const getLeagues = async (params = {}) => {
  const response = await apiFootball.get('/leagues', { params });
  return response.data.response;
};

module.exports = {
  getFixtures,
  getLiveFixtures,
  getFixtureStats,
  getFixtureEvents,
  getH2H,
  getTeamFixtures,
  getTeamStats,
  getTopScorers,
  getPredictions,
  searchTeams,
  getLeagues
};
