import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowLeft, CircleAlert, Download, ExternalLink, LoaderCircle, Play, Search, SlidersHorizontal, Sparkles, Star, Tv, X } from 'lucide-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { getCollection, getDetail, getHomepage, getMedia, getRecommendations, searchMovies, type MediaSource, type Movie } from '@/lib/api';
import { EmptyState, ErrorState, InstallPrompt, MovieCard, MovieRow, Navbar, Poster, RightsNote, SearchOverlay, SectionTitle, SkeletonRow } from '@/components/movie-ui';
import NotFound from '@/pages/not-found';
import './index.css';

const queryClient = new QueryClient();
const fallbackMovies: Movie[] = [
  { id: 'the-silent-hour', title: 'The Silent Hour', year: '2024', type: 'movie', rating: '8.1', overview: 'A suspended detective and a hearing-impaired witness navigate one night where every sound could change the case.', genres: ['Crime', 'Thriller'], poster: '', backdrop: '' },
  { id: 'orbit-zero', title: 'Orbit Zero', year: '2024', type: 'series', rating: '8.6', overview: 'Six astronauts find a signal in the dark that seems to know exactly who is listening.', genres: ['Sci-Fi', 'Drama'], poster: '', backdrop: '' },
  { id: 'night-market', title: 'Night Market', year: '2023', type: 'movie', rating: '7.8', overview: 'A Nairobi food courier becomes an unlikely witness to an art heist moving through the city after midnight.', genres: ['Drama', 'Mystery'], poster: '', backdrop: '' },
  { id: 'red-tide', title: 'Red Tide', year: '2024', type: 'movie', rating: '7.9', overview: 'A marine biologist races the clock when the coast begins to glow with a warning no one can explain.', genres: ['Adventure', 'Drama'], poster: '', backdrop: '' },
  { id: 'after-the-rain', title: 'After the Rain', year: '2022', type: 'movie', rating: '8.0', overview: 'Two old friends return to a city changed by the storms they once escaped.', genres: ['Romance', 'Drama'], poster: '', backdrop: '' },
];

function useAsync<T>(key: string, fetcher: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: string }>({ loading: true });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: undefined }));
    fetcherRef.current().then((data) => setState({ data, loading: false })).catch((error: unknown) => setState({ loading: false, error: error instanceof Error ? error.message : 'Unable to load this selection.' }));
  }, [key]);
  useEffect(() => { load(); }, [load, key]);
  return { ...state, retry: load };
}

function Shell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    document.documentElement.classList.add('dark');
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  }, []);
  return <div className="min-h-[100dvh] bg-background"><Navbar onSearch={() => setSearchOpen(true)} /><SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />{children}<InstallPrompt /><footer className="mx-auto flex max-w-[1440px] flex-col gap-3 border-t border-border px-5 py-8 text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10"><p className="font-display text-sm">Cymor<span className="text-primary">.</span> Movie Hub</p><p className="font-mono text-[10px] uppercase tracking-[.12em]">Built in Nairobi by Legendary Smiley Cymor</p></footer></div>;
}

function Home() {
  const home = useAsync('homepage', getHomepage);
  const trending = useAsync('trending', () => getCollection('/api/trending'));
  const popular = useAsync('popular', () => getCollection('/api/hot').catch(() => getCollection('/api/popular-search')));
  const featured = home.data?.length ? home.data : fallbackMovies;
  const hero = featured[0];
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setHeroIndex((current) => (current + 1) % Math.min(featured.length, 4)), 7000); return () => window.clearInterval(timer); }, [featured.length]);
  const currentHero = featured[heroIndex] || hero;
  return <main className="page-enter pb-10">
    <section className="relative min-h-[650px] overflow-hidden border-b border-white/[.05] pt-[70px] lg:min-h-[760px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(38,197,207,.18),transparent_26%),radial-gradient(circle_at_25%_90%,rgba(235,157,45,.13),transparent_28%)]"/>
      {currentHero.backdrop && <img src={currentHero.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 [mask-image:linear-gradient(to_right,black,transparent_78%)]" />}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent"/>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20"/>
      <div className="cinema-grid absolute inset-0 opacity-30"/>
      <div className="relative mx-auto flex min-h-[580px] max-w-[1440px] items-end px-5 pb-20 lg:items-center lg:px-10 lg:pb-4">
        <div className="max-w-2xl">
          <div className="mb-6 flex items-center gap-3 stagger-in"><span className="h-px w-10 bg-primary"/><span className="font-mono text-[10px] uppercase tracking-[.3em] text-primary">Tonight's transmission</span></div>
          <h1 className="font-display text-6xl font-bold leading-[.9] tracking-[-.08em] text-balance sm:text-8xl lg:text-[110px] stagger-in" style={{ animationDelay: '80ms' }}>{currentHero.title}</h1>
          <p className="mt-7 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base stagger-in" style={{ animationDelay: '160ms' }}>{currentHero.overview || 'A carefully selected frame from the world’s stories, ready when you are.'}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3 stagger-in" style={{ animationDelay: '230ms' }}><Link href={`/details?id=${encodeURIComponent(currentHero.id)}&type=${currentHero.type || 'movie'}`} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-[10px] uppercase tracking-[.16em] text-primary-foreground transition hover:-translate-y-0.5 hover:brightness-105" data-testid="link-hero-details"><Play size={14} fill="currentColor"/> Enter the story</Link><Link href="/browse" className="rounded-full border border-border bg-card/50 px-6 py-3 font-mono text-[10px] uppercase tracking-[.16em] text-foreground transition hover:border-primary hover:text-primary" data-testid="link-hero-browse">Browse archive</Link></div>
          <div className="mt-10 flex items-center gap-2">{featured.slice(0, 4).map((item, index) => <button key={item.id} onClick={() => setHeroIndex(index)} className={`h-1 rounded-full transition-all ${index === heroIndex ? 'w-10 bg-primary' : 'w-4 bg-muted'}`} aria-label={`Show ${item.title}`} data-testid={`button-hero-${index}`}/>)}</div>
        </div>
        <div className="absolute bottom-8 right-10 hidden max-w-[220px] text-right lg:block"><p className="font-mono text-[10px] uppercase leading-relaxed tracking-[.18em] text-muted-foreground">A living archive of<br/><span className="text-foreground">good stories</span> and late nights.</p></div>
      </div>
    </section>
    <div className="space-y-16 pt-14">
      <section className="mx-auto max-w-[1440px] px-5 lg:px-10"><div className="grid gap-4 sm:grid-cols-3"><Link href="/browse?type=movie" className="group rounded-2xl border border-border bg-card/60 p-5 transition hover:-translate-y-1 hover:border-primary/50" data-testid="link-quick-movies"><p className="font-mono text-[10px] uppercase tracking-widest text-primary">01 / Feature films</p><div className="mt-8 flex items-end justify-between"><span className="font-display text-2xl font-semibold">Make it a movie</span><ArrowIcon /></div></Link><Link href="/browse?type=series" className="group rounded-2xl border border-border bg-card/60 p-5 transition hover:-translate-y-1 hover:border-accent/50" data-testid="link-quick-series"><p className="font-mono text-[10px] uppercase tracking-widest text-accent">02 / Series</p><div className="mt-8 flex items-end justify-between"><span className="font-display text-2xl font-semibold">Stay for episodes</span><ArrowIcon /></div></Link><Link href="/browse?sort=latest" className="group rounded-2xl border border-border bg-card/60 p-5 transition hover:-translate-y-1 hover:border-primary/50" data-testid="link-quick-latest"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">03 / New arrivals</p><div className="mt-8 flex items-end justify-between"><span className="font-display text-2xl font-semibold">Fresh from the cut</span><ArrowIcon /></div></Link></div></section>
      <MovieRow title="Trending now" eyebrow="The room is watching" movies={trending.data?.length ? trending.data : fallbackMovies.slice(1)} />
      <MovieRow title="Popular in the archive" eyebrow="Worth your time" movies={popular.data?.length ? popular.data : featured.slice(0, 5)} />
      <section className="mx-auto max-w-[1440px] px-5 lg:px-10"><div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-[radial-gradient(circle_at_80%_10%,rgba(39,199,207,.18),transparent_30%),linear-gradient(135deg,#151b31,#111329)] p-7 sm:p-10"><Sparkles className="absolute right-8 top-8 text-accent/50" size={30}/><p className="font-mono text-[10px] uppercase tracking-[.22em] text-accent">Cymor field note</p><h2 className="mt-4 max-w-xl font-display text-3xl font-semibold leading-tight tracking-[-.05em] sm:text-5xl">Somewhere between a recommendation and a rabbit hole.</h2><p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Search by a feeling, a face, a year, or just type something strange. The archive is patient.</p><Link href="/browse" className="mt-7 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent" data-testid="link-field-note">Open the archive <ArrowIcon/></Link></div></section>
    </div>
    <RightsNote />
  </main>;
}

function ArrowIcon() { return <span className="transition-transform group-hover:translate-x-1">→</span>; }

function Browse() {
  const [location, setLocation] = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), [location]);
  const [query, setQuery] = useState(params.get('q') || '');
  const [type, setType] = useState(params.get('type') || '');
  const [sort, setSort] = useState(params.get('sort') || 'relevance');
  const fetcher = useCallback(() => query ? searchMovies(query, type) : getCollection('/api/browse', { type, sort, page: 1 }), [query, type, sort]);
  const results = useAsync(`${query}-${type}-${sort}`, fetcher);
  const submit = (event: React.FormEvent) => { event.preventDefault(); setLocation(`/browse${query ? `?q=${encodeURIComponent(query)}` : ''}${query && type ? `&type=${type}` : type ? `?type=${type}` : ''}`); };
  return <main className="page-enter mx-auto min-h-[calc(100dvh-140px)] max-w-[1440px] px-5 pb-16 pt-[120px] lg:px-10"><SectionTitle eyebrow="The archive" title={query ? `Results for “${query}”` : 'Browse everything'}><Link href="/browse" className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary sm:flex" data-testid="link-reset-browse">Reset view <X size={14}/></Link></SectionTitle>
    <div className="mb-10 grid gap-3 lg:grid-cols-[1fr_auto_auto]"><form onSubmit={submit} className="flex items-center gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 focus-within:border-primary"><Search size={17} className="text-primary"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the archive" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" data-testid="input-browse-search"/><button className="font-mono text-[10px] uppercase tracking-widest text-primary" data-testid="button-browse-search">Search</button></form><label className="flex items-center gap-2 rounded-xl border border-border bg-card/70 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Tv size={14}/><select value={type} onChange={(event) => setType(event.target.value)} className="bg-transparent text-foreground outline-none" aria-label="Filter type" data-testid="select-browse-type"><option value="">All formats</option><option value="movie">Movies</option><option value="series">Series</option><option value="tv">TV</option></select></label><label className="flex items-center gap-2 rounded-xl border border-border bg-card/70 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><SlidersHorizontal size={14}/><select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent text-foreground outline-none" aria-label="Sort results" data-testid="select-browse-sort"><option value="relevance">Relevance</option><option value="latest">Latest</option><option value="rating">Top rated</option></select></label></div>
    {results.loading && <SkeletonRow/>}{results.error && <ErrorState onRetry={results.retry}/>} {!results.loading && !results.error && (!results.data?.length ? <EmptyState title="No frames found" message="Try a wider search, or let the archive surprise you." action={<Link href="/browse" className="rounded-full bg-primary px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-primary-foreground" data-testid="link-empty-browse">Explore all</Link>}/> : <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-4 lg:grid-cols-6">{results.data.map((movie, index) => <MovieCard key={`${movie.id}-${index}`} movie={movie} index={index}/>)}</div>)}
    <RightsNote />
  </main>;
}

function Details() {
  const [location] = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), [location]);
  const id = params.get('id') || '';
  const type = params.get('type') || 'movie';
  const detail = useAsync(id, () => getDetail(id, type));
  const recommendations = useAsync(`recommend-${id}`, () => getRecommendations(id, type));
  const movie = detail.data;
  if (detail.loading) return <PageLoading/>;
  if (detail.error || !movie) return <main className="page-enter mx-auto max-w-[1440px] px-5 pb-16 pt-[140px] lg:px-10"><ErrorState onRetry={detail.retry}/></main>;
  return <main className="page-enter pb-16">
    <section className="relative min-h-[650px] overflow-hidden pt-[70px]"><div className="absolute inset-0">{movie.backdrop ? <img src={movie.backdrop} alt="" className="h-full w-full object-cover opacity-35"/> : <div className="h-full w-full bg-[radial-gradient(circle_at_75%_25%,rgba(39,199,207,.2),transparent_24%),linear-gradient(120deg,#171a2d,#090b18)]"/>}<div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"/><div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30"/></div><div className="relative mx-auto grid max-w-[1440px] items-end gap-10 px-5 pb-16 lg:grid-cols-[240px_1fr] lg:px-10"><div className="hidden aspect-[2/3] overflow-hidden rounded-xl border border-white/10 shadow-2xl lg:block"><Poster movie={movie}/></div><div className="max-w-3xl"><Link href="/browse" className="mb-12 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary" data-testid="link-back-browse"><ArrowLeft size={14}/> Back to archive</Link><p className="font-mono text-[10px] uppercase tracking-[.22em] text-primary">{movie.type || 'Feature'} {movie.year ? ` / ${movie.year}` : ''}</p><h1 className="mt-3 font-display text-5xl font-bold leading-[.95] tracking-[-.07em] sm:text-7xl">{movie.title}</h1><div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><span className="flex items-center gap-1 text-primary"><Star size={13} fill="currentColor"/> {movie.rating || 'Unrated'}</span>{movie.runtime && <><span className="text-border">/</span><span>{movie.runtime}</span></>}{movie.language && <><span className="text-border">/</span><span>{movie.language}</span></>}</div><p className="mt-7 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{movie.overview || 'Details for this title are still being assembled by the archive.'}</p><div className="mt-8 flex flex-wrap gap-3"><Link href={`/watch?id=${encodeURIComponent(movie.id)}&type=${movie.type || 'movie'}`} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-primary-foreground" data-testid="link-watch-title"><Play size={14} fill="currentColor"/> Watch now</Link><Link href={`/download?id=${encodeURIComponent(movie.id)}&type=${movie.type || 'movie'}`} className="flex items-center gap-2 rounded-full border border-border bg-card/40 px-6 py-3 font-mono text-[10px] uppercase tracking-widest transition hover:border-primary hover:text-primary" data-testid="link-download-title"><Download size={14}/> Authorized download</Link></div><div className="mt-8 flex flex-wrap gap-2">{(movie.genres || []).map((genre) => <span key={genre} className="rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{genre}</span>)}</div></div></div></section>
    <div className="mx-auto max-w-[1440px] space-y-14 px-5 lg:px-10"><section className="grid gap-8 border-y border-border py-8 md:grid-cols-3"><Meta label="Format" value={movie.type || 'Film'}/><Meta label="Archive ID" value={movie.id}/><Meta label="Rights note" value="Access varies by source"/></section><MovieRow title="You may also enter" eyebrow="Same frequency" movies={recommendations.data || []}/><RightsNote/></div>
  </main>;
}

function Meta({ label, value }: { label: string; value: string }) { return <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">{label}</p><p className="mt-2 truncate text-sm text-muted-foreground">{value}</p></div>; }

function MediaPage({ mode }: { mode: 'play' | 'download' }) {
  const [location] = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), [location]);
  const id = params.get('id') || ''; const type = params.get('type') || 'movie';
  const movie = useAsync(`media-detail-${id}`, () => getDetail(id, type));
  const media = useAsync(`media-${mode}-${id}-${type}`, () => getMedia(id, type, mode));
  const title = movie.data?.title || 'Your selection';
  return <main className="page-enter min-h-[calc(100dvh-140px)] px-5 pb-16 pt-[120px] lg:px-10"><div className="mx-auto max-w-[1100px]"><Link href={`/details?id=${encodeURIComponent(id)}&type=${type}`} className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary" data-testid="link-back-details"><ArrowLeft size={14}/> Back to details</Link>{mode === 'play' ? <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-2xl"><div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,#1d2844,#070812_65%)]">{media.loading ? <LoaderCircle className="animate-spin text-primary" size={30}/> : media.data?.[0] ? <video controls autoPlay className="h-full w-full" poster={movie.data?.backdrop || movie.data?.poster} src={media.data[0].url}><track kind="captions" src={media.data[0].captions} srcLang="en" label="English"/></video> : <div className="px-6 text-center"><CircleAlert className="mx-auto mb-4 text-primary" size={28}/><h2 className="font-display text-xl font-semibold">This reel is not available here.</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">No playable source was returned. Try again later or choose another title in the archive.</p></div>}</div></div> : <DownloadPanel title={title} media={media.data || []} loading={media.loading}/>}<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-primary">{mode === 'play' ? 'Now screening' : 'Authorized offline access'}</p><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.05em]">{title}</h1></div><p className="max-w-md text-right font-mono text-[10px] uppercase leading-relaxed tracking-[.08em] text-muted-foreground">Only use sources you are authorized to access. Cymor does not bypass DRM or access controls.</p></div>{media.error && <p className="mt-6 text-sm text-muted-foreground">Source lookup is temporarily unavailable. Refresh to try the connected providers again.</p>}</div></main>;
}

function DownloadPanel({ title, media, loading }: { title: string; media: MediaSource[]; loading: boolean }) {
  return <div className="rounded-2xl border border-border bg-card p-6 sm:p-8"><div className="flex items-start justify-between gap-4 border-b border-border pb-6"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Available files</p><h2 className="mt-2 font-display text-2xl font-semibold">{title}</h2></div><Download className="text-primary" size={24}/></div>{loading ? <div className="space-y-3 pt-6">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-16 rounded-xl"/>)}</div> : media.length ? <div className="space-y-3 pt-6">{media.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" download className="flex items-center justify-between rounded-xl border border-border p-4 transition hover:border-primary hover:bg-primary/5" key={`${source.url}-${index}`} data-testid={`link-download-source-${index}`}><div><p className="font-display font-semibold">{source.quality || source.label || `Source ${index + 1}`}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{source.type || 'Media file'} {source.size ? `/ ${source.size}` : ''}</p></div><ExternalLink size={17} className="text-primary"/></a>)}</div> : <EmptyState title="No files surfaced" message="The connected providers did not return an authorized file for this title."/>}</div>;
}

function PageLoading() { return <main className="mx-auto max-w-[1440px] px-5 pb-16 pt-[140px] lg:px-10"><div className="skeleton h-8 w-28 rounded"/><div className="mt-6 skeleton h-16 max-w-xl rounded"/><div className="mt-5 skeleton h-5 max-w-lg rounded"/><div className="mt-10 skeleton aspect-video max-w-3xl rounded-2xl"/></main>; }

function Router() {
  return <ErrorBoundary><Shell><Switch><Route path="/" component={Home}/><Route path="/browse" component={Browse}/><Route path="/details" component={Details}/><Route path="/watch" component={() => <MediaPage mode="play"/>}/><Route path="/download" component={() => <MediaPage mode="download"/>}/><Route component={NotFound}/></Switch></Shell></ErrorBoundary>;
}

export default function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>; }