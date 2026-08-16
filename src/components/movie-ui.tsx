import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight, Download, Film, Heart, Menu, Play, Search, X } from 'lucide-react';
import type { Movie } from '@/lib/api';

export function Logo() {
  return <Link href="/" className="flex items-center gap-3" data-testid="link-home-logo"><span className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(238,169,57,.2)]"><Film size={18} strokeWidth={2.5}/><i className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent" /></span><span className="font-display text-lg font-bold tracking-[-.04em]">Cymor<span className="text-primary">.</span></span></Link>;
}

export function Navbar({ onSearch }: { onSearch: () => void }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  return <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[.06] bg-[rgba(9,11,24,.78)] backdrop-blur-xl">
    <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
      <Logo />
      <nav className="hidden items-center gap-7 md:flex">
        {['/', '/browse'].map((href) => <Link key={href} href={href} className={`font-mono text-[11px] uppercase tracking-[.18em] transition-colors ${location === href ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid={`link-nav-${href === '/' ? 'home' : 'browse'}`}>{href === '/' ? 'Discover' : 'Browse'}</Link>)}
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={onSearch} className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Open search" data-testid="button-open-search"><Search size={18}/></button>
        <Link href="/browse?type=movie" className="hidden rounded-full border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground transition hover:border-primary hover:text-primary sm:block" data-testid="link-movies">Movies</Link>
        <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground md:hidden" aria-label="Toggle menu" data-testid="button-menu">{open ? <X size={18}/> : <Menu size={18}/>}</button>
      </div>
    </div>
    {open && <div className="border-t border-border bg-background px-5 py-5 md:hidden"><Link href="/" onClick={() => setOpen(false)} className="block py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground" data-testid="link-mobile-discover">Discover</Link><Link href="/browse" onClick={() => setOpen(false)} className="block py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground" data-testid="link-mobile-browse">Browse all</Link></div>}
  </header>;
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  useEffect(() => { if (!open) setQuery(''); }, [open]);
  if (!open) return null;
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (query.trim()) { localStorage.setItem('cymor:last-search', query.trim()); setLocation(`/browse?q=${encodeURIComponent(query.trim())}`); onClose(); } };
  return <div className="fixed inset-0 z-50 bg-[rgba(8,10,20,.9)] p-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Search Cymor" onClick={onClose}>
    <div className="mx-auto mt-[12vh] max-w-3xl" onClick={(event) => event.stopPropagation()}>
      <div className="mb-8 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.22em] text-primary">Find your next watch</span><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground" aria-label="Close search" data-testid="button-close-search"><X size={18}/></button></div>
      <form onSubmit={submit} className="flex items-center gap-4 border-b-2 border-primary pb-4"><Search className="text-primary" size={26}/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search films, series, cast..." className="w-full bg-transparent font-display text-3xl outline-none placeholder:text-muted-foreground/40 sm:text-5xl" data-testid="input-global-search"/><button type="submit" className="rounded-full bg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-primary-foreground" data-testid="button-submit-search">Go</button></form>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Press enter to explore the archive</p>
    </div>
  </div>;
}

export function Poster({ movie, className = '' }: { movie: Movie; className?: string }) {
  return movie.poster ? <img src={movie.poster} alt={`${movie.title} poster`} className={`h-full w-full object-cover ${className}`} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className={`grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#39415c,#191d31_58%,#101222)] ${className}`}><Film className="text-primary/50" size={30}/></div>;
}

export function MovieCard({ movie, index = 0, compact = false }: { movie: Movie; index?: number; compact?: boolean }) {
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem('cymor:favorites') || '[]').includes(movie.id));
  const toggle = (event: React.MouseEvent) => { event.preventDefault(); event.stopPropagation(); const current: string[] = JSON.parse(localStorage.getItem('cymor:favorites') || '[]'); const next = current.includes(movie.id) ? current.filter((id) => id !== movie.id) : [...current, movie.id]; localStorage.setItem('cymor:favorites', JSON.stringify(next)); setSaved(!saved); };
  return <Link href={`/details?id=${encodeURIComponent(movie.id)}&type=${encodeURIComponent(movie.type || 'movie')}`} className={`group block min-w-0 stagger-in ${compact ? 'w-[126px] sm:w-[154px]' : 'w-full'}`} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }} data-testid={`card-movie-${movie.id}`}>
    <div className={`relative overflow-hidden rounded-xl border border-white/[.07] bg-card shadow-[0_16px_35px_rgba(0,0,0,.16)] ${compact ? 'aspect-[2/3]' : 'aspect-[2/3]'}`}>
      <Poster movie={movie} className="transition duration-500 group-hover:scale-105"/>
      <div className="absolute inset-0 bg-gradient-to-t from-[#090b18] via-transparent to-transparent opacity-80"/>
      <div className="absolute inset-x-0 bottom-0 flex translate-y-1 items-end justify-between p-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Play size={13} fill="currentColor"/></span><button onClick={toggle} className={`grid h-8 w-8 place-items-center rounded-full border ${saved ? 'border-primary bg-primary text-primary-foreground' : 'border-white/25 bg-black/30 text-white'} backdrop-blur`} aria-label={saved ? 'Remove favorite' : 'Add favorite'} data-testid={`button-favorite-${movie.id}`}>{saved ? <Check size={14}/> : <Heart size={14}/>}</button></div>
      {movie.rating && <span className="absolute left-3 top-3 rounded-md bg-black/50 px-2 py-1 font-mono text-[10px] text-primary backdrop-blur">{movie.rating}</span>}
    </div>
    <div className="pt-3"><h3 className="truncate font-display text-sm font-semibold text-foreground group-hover:text-primary">{movie.title}</h3><p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{movie.year || 'New'} <span className="mx-1 text-border">/</span> {movie.type || 'film'}</p></div>
  </Link>;
}

export function MovieRow({ title, eyebrow, movies, action = 'View all' }: { title: string; eyebrow?: string; movies: Movie[]; action?: string }) {
  const scroll = (direction: number) => document.getElementById(`row-${title.replace(/\W/g, '')}`)?.scrollBy({ left: direction * 440, behavior: 'smooth' });
  if (!movies.length) return null;
  return <section className="relative mx-auto max-w-[1440px] px-5 lg:px-10"><div className="mb-5 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-primary">{eyebrow || 'Curated for you'}</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-.04em] sm:text-3xl">{title}</h2></div><div className="hidden items-center gap-2 sm:flex"><button onClick={() => scroll(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary" aria-label={`Previous ${title}`} data-testid={`button-prev-${title}`}><ChevronLeft size={16}/></button><button onClick={() => scroll(1)} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary" aria-label={`Next ${title}`} data-testid={`button-next-${title}`}><ChevronRight size={16}/></button><Link href="/browse" className="ml-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground transition hover:text-primary" data-testid={`link-view-${title}`}>{action}<ArrowRight size={13}/></Link></div></div><div id={`row-${title.replace(/\W/g, '')}`} className="flex snap-x gap-4 overflow-x-auto pb-6 scrollbar-none">{movies.map((movie, index) => <MovieCard key={`${movie.id}-${index}`} movie={movie} index={index} compact />)}</div></section>;
}

export function SectionTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <div className="mb-7 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-primary">{eyebrow}</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-.06em] sm:text-5xl">{title}</h1></div>{children}</div>;
}

export function SkeletonRow() { return <div className="flex gap-4 overflow-hidden">{Array.from({ length: 6 }).map((_, index) => <div className="min-w-[126px] sm:min-w-[154px]" key={index}><div className="skeleton aspect-[2/3] rounded-xl"/><div className="skeleton mt-3 h-4 w-4/5 rounded"/><div className="skeleton mt-2 h-3 w-2/5 rounded"/></div>)}</div>; }

export function RightsNote() { return <div className="mx-auto flex max-w-[1440px] items-start gap-3 border-t border-border px-5 py-8 text-muted-foreground lg:px-10"><Bookmark size={15} className="mt-0.5 shrink-0 text-primary"/><p className="max-w-3xl font-mono text-[10px] uppercase leading-relaxed tracking-[.08em]">Cymor is a discovery interface. Only stream or download titles you are authorized to access. Availability depends on the rights and sources returned by the connected service.</p></div>; }

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) { return <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center"><Film className="mx-auto mb-4 text-primary/70" size={30}/><h2 className="font-display text-xl font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{message}</p>{action && <div className="mt-6">{action}</div>}</div>; }

export function ErrorState({ onRetry }: { onRetry?: () => void }) { return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"><h2 className="font-display text-xl font-semibold">The projector missed a reel.</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">This part of the archive is taking a pause. Try again, or keep exploring what is already here.</p>{onRetry && <button onClick={onRetry} className="mt-5 rounded-full border border-primary px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-primary" data-testid="button-retry">Try again</button>}</div>; }

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('cymor:install-dismissed') === '1');
  useEffect(() => { const handler = (event: Event) => { event.preventDefault(); setInstallEvent(event as BeforeInstallPromptEvent); }; window.addEventListener('beforeinstallprompt', handler); return () => window.removeEventListener('beforeinstallprompt', handler); }, []);
  if (!installEvent || dismissed) return null;
  const install = async () => { await installEvent.prompt(); setInstallEvent(null); };
  return <div className="fixed bottom-5 left-5 right-5 z-30 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-card/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,.4)] backdrop-blur-xl"><div><p className="font-display font-semibold">Take Cymor with you</p><p className="mt-1 text-xs text-muted-foreground">Install the cinema for faster access.</p></div><div className="flex shrink-0 gap-2"><button onClick={() => { setDismissed(true); localStorage.setItem('cymor:install-dismissed', '1'); }} className="rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground" data-testid="button-dismiss-install">Not now</button><button onClick={install} className="rounded-full bg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-primary-foreground" data-testid="button-install">Install</button></div></div>;
}

export type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };