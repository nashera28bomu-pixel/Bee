import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000
});

// Matches
export const getMatchesToday = () => api.get('/matches/today');
export const getLiveMatches = () => api.get('/matches/live');
export const getMatchesByDate = (date) => api.get(`/matches/date/${date}`);
export const getMatchStats = (id) => api.get(`/matches/${id}/stats`);
export const getMatchEvents = (id) => api.get(`/matches/${id}/events`);
export const getMatchPredictions = (id) => api.get(`/matches/${id}/predictions`);
export const getLeagueMatches = (leagueId, season) =>
  api.get(`/matches/league/${leagueId}`, { params: { season } });

// Teams
export const searchTeams = (name) => api.get('/teams/search', { params: { name } });
export const getTeamForm = (id, last = 5) => api.get(`/teams/${id}/form`, { params: { last } });
export const getTeamStats = (id, league, season) =>
  api.get(`/teams/${id}/stats`, { params: { league, season } });

// H2H
export const getH2H = (team1, team2, last = 10) =>
  api.get('/h2h', { params: { team1, team2, last } });

// Odds
export const getOdds = (league = 'Premier League') =>
  api.get('/odds', { params: { league } });
export const getLiveOdds = (league = 'Premier League') =>
  api.get('/odds/live', { params: { league } });
export const getOddsLeagues = () => api.get('/odds/leagues');
export const getMatchOdds = (home, away, league) =>
  api.get('/odds/match', { params: { home, away, league } });

export default api;
