const axios = require('axios');

const oddsApi = axios.create({
  baseURL: 'https://api.the-odds-api.com/v4',
  params: {
    apiKey: process.env.ODDS_API_KEY
  }
});

// Get sports list
const getSports = async () => {
  const response = await oddsApi.get('/sports');
  return response.data;
};

// Get odds for a sport
const getOdds = async (sport = 'soccer_epl', regions = 'uk,eu', markets = 'h2h,totals') => {
  const response = await oddsApi.get(`/sports/${sport}/odds`, {
    params: { regions, markets, oddsFormat: 'decimal' }
  });
  return response.data;
};

// Get live odds
const getLiveOdds = async (sport = 'soccer_epl', regions = 'uk,eu') => {
  const response = await oddsApi.get(`/sports/${sport}/odds-live`, {
    params: { regions, markets: 'h2h', oddsFormat: 'decimal' }
  });
  return response.data;
};

// Get scores
const getScores = async (sport = 'soccer_epl', daysFrom = 1) => {
  const response = await oddsApi.get(`/sports/${sport}/scores`, {
    params: { daysFrom }
  });
  return response.data;
};

// Supported soccer leagues mapping
const SOCCER_SPORTS = {
  'Premier League': 'soccer_epl',
  'La Liga': 'soccer_spain_la_liga',
  'Serie A': 'soccer_italy_serie_a',
  'Bundesliga': 'soccer_germany_bundesliga',
  'Ligue 1': 'soccer_france_ligue_one',
  'Champions League': 'soccer_uefa_champs_league',
  'Europa League': 'soccer_uefa_europa_league',
  'MLS': 'soccer_usa_mls'
};

module.exports = { getSports, getOdds, getLiveOdds, getScores, SOCCER_SPORTS };
