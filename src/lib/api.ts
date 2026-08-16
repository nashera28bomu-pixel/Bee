export const API_BASE = (import.meta.env.VITE_API_BASE || 'https://movieapi.xcasper.space').replace(/\/$/, '');

export type Movie = {
  id: string;
  title: string;
  year?: string;
  poster?: string;
  backdrop?: string;
  overview?: string;
  type?: string;
  rating?: string;
  runtime?: string;
  genres?: string[];
  language?: string;
  country?: string;
  episodes?: number;
  raw?: Record<string, unknown>;
};

export type MediaSource = { url: string; label?: string; quality?: string; type?: string; size?: string; captions?: string };

const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});
const first = (record: Record<string, unknown>, keys: string[]) => keys.map((key) => record[key]).find((value) => value !== undefined && value !== null && value !== '');
const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const arrayFrom = (value: unknown): unknown[] => Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value as Record<string, unknown>) : [];

const findList = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  for (const key of ['results', 'items', 'data', 'movies', 'shows', 'contents', 'list', 'recommendations', 'hits']) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const nested = findList(value);
      if (nested.length) return nested;
    }
  }
  return payload && typeof payload === 'object' ? [payload] : [];
};

const image = (record: Record<string, unknown>, keys: string[]) => {
  const value = first(record, keys);
  const candidate = typeof value === 'string'
    ? value
    : value && typeof value === 'object'
      ? first(asRecord(value), ['url', 'src', 'link', 'imageUrl'])
      : undefined;
  if (typeof candidate === 'string') return candidate.startsWith('//') ? `https:${candidate}` : candidate;
  return '';
};

export function normalizeMovie(value: unknown, index = 0): Movie {
  const outer = asRecord(value);
  const nestedCandidate = first(outer, ['data', 'result', 'movie', 'show', 'detail']);
  const nested = asRecord(nestedCandidate);
  const subject = asRecord(first(nested, ['subject', 'movie', 'show', 'detail']));
  const record = first(outer, ['title', 'name', 'original_title', 'originalName', 'subjectId'])
    ? outer
    : first(nested, ['title', 'name', 'original_title', 'originalName', 'subjectId'])
      ? nested
      : Object.keys(subject).length
        ? subject
        : (Object.keys(nested).length ? nested : outer);
  const title = text(first(record, ['title', 'name', 'original_title', 'originalName', 'showName'])) || `Untitled selection ${index + 1}`;
  const id = text(first(record, ['id', 'subjectId', 'imdb_id', 'imdbId', 'tmdb_id', 'slug', 'movieId', 'showId'])) || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`;
  const genresRaw = first(record, ['genres', 'genre', 'categories']);
  const genres = arrayFrom(genresRaw).map((genre) => typeof genre === 'string' ? genre : text(first(asRecord(genre), ['name', 'title']))).filter(Boolean);
  return {
    id, title,
    year: text(first(record, ['year', 'release_year', 'releaseDate', 'released', 'date'])).slice(0, 4),
    poster: image(record, ['poster', 'poster_path', 'posterUrl', 'image', 'thumbnail', 'cover']),
    backdrop: image(record, ['backdrop', 'backdrop_path', 'backdropUrl', 'background', 'banner', 'fanart']),
    overview: text(first(record, ['overview', 'plot', 'description', 'synopsis', 'summary'])),
    type: text(first(record, ['type', 'media_type', 'mediaType', 'kind'])) || 'movie',
    rating: text(first(record, ['rating', 'vote_average', 'score', 'imdbRating'])),
    runtime: text(first(record, ['runtime', 'duration', 'length'])),
    genres, language: text(first(record, ['language', 'original_language'])),
    country: text(first(record, ['country', 'origin_country'])),
    episodes: Number(first(record, ['episodes', 'number_of_episodes'])) || undefined,
    raw: record,
  };
}

export function normalizeMovies(payload: unknown): Movie[] {
  return findList(payload).map((item, index) => normalizeMovie(item, index)).filter((item) => item.title);
}

export function normalizeMedia(payload: unknown): MediaSource[] {
  const output: MediaSource[] = [];
  const walk = (value: unknown) => {
    if (!value) return;
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
      if (!output.some((item) => item.url === value)) output.push({ url: value, label: 'Source' });
      return;
    }
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (typeof value === 'object') {
      const record = asRecord(value);
      const url = text(first(record, ['url', 'file', 'link', 'stream', 'download', 'src', 'source']));
      if (/^https?:\/\//i.test(url)) {
        output.push({
          url, label: text(first(record, ['label', 'name', 'source', 'server'])) || 'Source',
          quality: text(first(record, ['quality', 'resolution', 'size_label'])) || 'Auto',
          type: text(first(record, ['type', 'mime', 'format'])),
          size: text(first(record, ['size', 'file_size'])),
          captions: text(first(record, ['captions', 'subtitle', 'subtitles'])),
        });
      }
      Object.values(record).forEach((nested) => walk(nested));
    }
  };
  walk(payload);
  return output.filter((item, index, all) => all.findIndex((other) => other.url === item.url) === index);
}

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { Accept: 'application/json', ...(options?.headers || {}) } });
  if (!response.ok) throw new Error(`The cinema service returned ${response.status}.`);
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('json') ? response.json() : response.text();
}

export async function apiRequest(path: string, params: Record<string, string | number | undefined> = {}, method: 'GET' | 'POST' = 'GET') {
  const clean = Object.entries(params).filter(([, value]) => value !== undefined && value !== '');
  if (method === 'POST') return request(path, { method, body: JSON.stringify(params), headers: { 'Content-Type': 'application/json' } });
  const query = new URLSearchParams(clean.map(([key, value]) => [key, String(value)]));
  return request(`${path}${query.toString() ? `?${query.toString()}` : ''}`);
}

export async function searchMovies(query: string, type?: string) {
  const payload = await apiRequest('/api/search', { query, q: query, type }).catch(() => apiRequest('/api/search', { query, q: query, type }, 'POST'));
  return normalizeMovies(payload);
}
export async function getHomepage() {
  try {
    const payload = await apiRequest('/api/homepage');
    const root = asRecord(payload);
    const data = asRecord(root.data || payload);
    const curated = [...arrayFrom(data.topPickList), ...arrayFrom(data.homeList)];
    return curated.length ? normalizeMovies(curated) : [];
  } catch { return []; }
}
export async function getCollection(path: string, params: Record<string, string | number | undefined> = {}) {
  return normalizeMovies(await apiRequest(path, params));
}
export async function getDetail(id: string, type?: string) {
  const subjectType = type === 'series' || type === 'tv' ? 2 : 1;
  const params = { id, subjectId: id, imdb_id: id, type, subjectType };
  const payload = await apiRequest('/api/rich-detail', params).catch(() => apiRequest('/api/detail', params));
  return normalizeMovie(payload);
}
export async function getRecommendations(id: string, type?: string) {
  return normalizeMovies(await apiRequest('/api/recommend', { id, subjectId: id, type }).catch(() => []));
}
export async function getMedia(id: string, type: string | undefined, mode: 'play' | 'download') {
  const paths = mode === 'play' ? ['/api/play', '/api/bff/stream', '/api/stream', '/api/showbox/streams'] : ['/api/newtoxic/files', '/api/newtoxic/resolve', '/api/showbox/streams', '/api/stream'];
  for (const path of paths) {
    try {
      const payload = await apiRequest(path, { id, subjectId: id, imdb_id: id, type, movieId: id, showId: id });
      const sources = normalizeMedia(payload);
      if (sources.length) return sources;
    } catch { /* Try the next compatible provider. */ }
  }
  return [];
}

// The long tail of the service stays behind the same small client so route-level
// components never need to know provider-specific parameter names.
export const movieService = {
  suggest: (query: string) => apiRequest('/api/search/suggest', { query, q: query }),
  popularSearch: () => getCollection('/api/popular-search'),
  hot: () => getCollection('/api/hot'),
  browse: (params: Record<string, string | number | undefined> = {}) => getCollection('/api/browse', params),
  ranking: (params: Record<string, string | number | undefined> = {}) => getCollection('/api/ranking', params),
  recommend: (id: string, type?: string) => getRecommendations(id, type),
  staffDetail: (id: string) => apiRequest('/api/staff/detail', { id }),
  staffWorks: (id: string) => apiRequest('/api/staff/works', { id }),
  staffRelated: (id: string) => apiRequest('/api/staff/related', { id }),
  showboxSearch: (query: string) => apiRequest('/api/showbox/search', { query, q: query }),
  showboxMovie: (id: string) => apiRequest('/api/showbox/movie', { id }),
  showboxTv: (id: string) => apiRequest('/api/showbox/tv', { id }),
  stream: (id: string, type?: string) => apiRequest('/api/stream', { id, type }),
  showboxStreams: (id: string, type?: string) => apiRequest('/api/showbox/streams', { id, type }),
  newToxicSearch: (query: string) => apiRequest('/api/newtoxic/search', { query, q: query }),
  newToxicDetail: (id: string) => apiRequest('/api/newtoxic/detail', { id }),
  newToxicFiles: (id: string, type?: string) => apiRequest('/api/newtoxic/files', { id, type }),
  newToxicResolve: (id: string, type?: string) => apiRequest('/api/newtoxic/resolve', { id, type }),
  newToxicLatest: () => apiRequest('/api/newtoxic/latest'),
  newToxicFeatured: () => apiRequest('/api/newtoxic/featured'),
  live: () => apiRequest('/api/live'),
  captions: (id: string, type?: string) => apiRequest('/api/captions', { id, subjectId: id, type }),
};