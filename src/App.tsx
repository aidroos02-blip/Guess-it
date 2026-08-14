import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  Gamepad2,
  Globe2,
  Info,
  List,
  Loader2,
  LockKeyhole,
  Moon,
  Music2,
  Play,
  RotateCcw,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  UserRound,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import {
  type CategorySummary,
  type Game,
  type GameResult,
  type LeaderboardEntry,
  type Question,
  getGetDailyChallengeQueryKey,
  getGetProfileQueryKey,
  getListCategoriesQueryKey,
  getListLeaderboardsQueryKey,
  getListQuestionsQueryKey,
  useCompleteGame,
  useGetDailyChallenge,
  useGetProfile,
  useListCategories,
  useListLeaderboards,
  useListQuestions,
  useStartGame,
  useTrackAnalyticsEvent,
  useUpdateProfile,
} from '@/lib/api-client-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { adService } from '@/lib/ad-service';

const queryClient = new QueryClient();

const fallbackCategories: CategorySummary[] = [
  { id: 'General Knowledge', label: 'General Knowledge', icon: 'spark', count: 120, accent: '#ff7059' },
  { id: 'Movies', label: 'Movies', icon: 'film', count: 86, accent: '#b9dc5a' },
  { id: 'Sports', label: 'Sports', icon: 'bolt', count: 94, accent: '#35c8c1' },
  { id: 'Music', label: 'Music', icon: 'music', count: 78, accent: '#a78bfa' },
  { id: 'India', label: 'India', icon: 'globe', count: 110, accent: '#f2b84b' },
  { id: 'Funny', label: 'Funny', icon: 'smile', count: 63, accent: '#ff9d72' },
];

const iconForCategory = (icon: string, size = 19) => {
  const props = { size, strokeWidth: 2.2 };
  if (icon === 'film') return <List {...props} />;
  if (icon === 'bolt') return <Zap {...props} />;
  if (icon === 'music') return <Music2 {...props} />;
  if (icon === 'globe') return <Globe2 {...props} />;
  if (icon === 'smile') return <Sparkles {...props} />;
  return <CircleHelp {...props} />;
};

function LoadingBlock({ label = 'Getting things ready' }: { label?: string }) {
  return (
    <div className="space-y-3" data-testid="status-loading">
      <div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
      <div className="h-32 animate-pulse rounded-[1.4rem] bg-muted" />
      <p className="font-mono text-[11px] uppercase tracking-[.18em] text-muted-foreground">{label}</p>
    </div>
  );
}

function ErrorBlock({ onRetry, label = 'Something got tangled.' }: { onRetry?: () => void; label?: string }) {
  return (
    <div className="rounded-[1.4rem] border border-destructive/30 bg-destructive/10 p-6 text-center" data-testid="status-error">
      <X className="mx-auto mb-3 text-destructive" />
      <p className="font-display text-lg font-bold">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">Give it another tap. Your streak is safe.</p>
      {onRetry && <button className="pressable mt-4 rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background" onClick={onRetry} data-testid="button-retry">Try again</button>}
    </div>
  );
}

function EmptyBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-border bg-card/60 p-8 text-center" data-testid="status-empty">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-secondary text-foreground"><CircleHelp /></div>
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-home-logo">
      <span className="grid size-10 rotate-[-7deg] place-items-center rounded-[13px] bg-primary font-display text-xl font-bold text-primary-foreground shadow-[4px_4px_0_hsl(var(--foreground)/.12)]">?</span>
      <span className="font-display text-[1.38rem] font-bold tracking-[-.06em]">Guess It<span className="text-primary">!</span></span>
    </Link>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const profileQuery = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const [dark, setDark] = useState(() => localStorage.getItem('guess-dark') === 'true');
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (profileQuery.data?.darkMode !== undefined) setDark(profileQuery.data.darkMode);
  }, [profileQuery.data?.darkMode]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('guess-dark', String(dark));
  }, [dark]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    updateProfile.mutate({ data: { darkMode: next } });
  };

  const nav = [
    { href: '/', label: 'Home', icon: Gamepad2 },
    { href: '/leaderboard', label: 'Ranks', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: UserRound },
  ];

  return (
    <div className="app-shell bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <AppLogo />
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="pressable grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground" aria-label="Toggle dark mode" data-testid="button-toggle-theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/settings" className="pressable grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground" aria-label="Settings" data-testid="link-settings">
            <Settings size={18} />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-28 sm:px-8 sm:pb-12">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/90 px-5 py-3 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href} className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-[.12em] ${location === href ? 'text-primary' : 'text-muted-foreground'}`} data-testid={`link-nav-${label.toLowerCase()}`}>
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="font-mono text-[10px] font-medium uppercase tracking-[.2em] text-primary">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-bold tracking-[-.04em] sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function CategoryPill({ category, selected, onClick }: { category: CategorySummary; selected?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`pressable flex items-center gap-3 rounded-2xl border px-3 py-3 text-left ${selected ? 'border-foreground bg-foreground text-background' : 'border-border bg-card'}`} data-testid={`button-category-${category.id.replaceAll(' ', '-').toLowerCase()}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: selected ? 'hsl(var(--secondary))' : `${category.accent}22`, color: selected ? 'hsl(var(--foreground))' : category.accent }}>{iconForCategory(category.icon)}</span>
      <span className="min-w-0"><span className="block truncate text-sm font-bold">{category.label}</span><span className={`font-mono text-[10px] ${selected ? 'text-background/60' : 'text-muted-foreground'}`}>{category.count} questions</span></span>
    </button>
  );
}

function useCategoryData() {
  const query = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  return { ...query, categories: query.data?.length ? query.data : fallbackCategories };
}

function HomePage() {
  const { categories, isLoading, isError, refetch } = useCategoryData();
  const daily = useGetDailyChallenge({ query: { queryKey: getGetDailyChallengeQueryKey() } });
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const ranks = useListLeaderboards({ period: 'daily' }, { query: { queryKey: getListLeaderboardsQueryKey({ period: 'daily' }) } });
  const track = useTrackAnalyticsEvent();
  const [, setLocation] = useLocation();

  const startDaily = () => {
    track.mutate({ data: { event: 'games_started', category: 'daily' } });
    setLocation('/play?mode=daily');
  };

  const topPlayers = (ranks.data ?? []).slice(0, 3);
  return (
    <div className="space-y-10 pt-3 sm:pt-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-foreground px-6 py-8 text-background shadow-[0_18px_55px_hsl(var(--foreground)/.16)] sm:px-10 sm:py-12">
        <div className="soft-grid absolute inset-0 opacity-20" />
        <div className="absolute -right-10 -top-16 size-52 rounded-full border-[22px] border-secondary/80 sm:size-72" />
        <div className="absolute bottom-[-65px] right-24 size-36 rounded-full border-[18px] border-primary/80" />
        <div className="relative max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[.15em] text-foreground"><Sparkles size={13} /> Ten questions. One clean run.</div>
          <h1 className="font-display text-[3.5rem] font-bold leading-[.88] tracking-[-.08em] sm:text-[5.5rem]">How sharp<br /><span className="text-primary">are you?</span></h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-background/65 sm:text-base">A tiny trivia ritual with a big little rush. Pick a lane, trust your first thought, and keep your streak glowing.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/play" className="pressable inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-extrabold text-primary-foreground" data-testid="link-quick-play"><Play size={17} fill="currentColor" /> Quick play <ArrowRight size={16} /></Link>
            <button onClick={startDaily} className="pressable inline-flex items-center gap-2 rounded-xl border border-background/20 bg-background/10 px-5 py-3.5 text-sm font-bold" data-testid="button-daily-challenge"><Flame size={17} className="text-secondary" /> Daily challenge</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Current streak', value: profile.data?.currentStreak ?? 0, suffix: 'days', icon: Flame, color: 'text-primary' },
          { label: 'Best score', value: profile.data?.bestScore ?? 0, suffix: '/ 100', icon: Trophy, color: 'text-secondary' },
          { label: 'Games played', value: profile.data?.totalGames ?? 0, suffix: 'runs', icon: BarChart3, color: 'text-accent' },
          { label: 'Average score', value: profile.data?.averageScore ? Math.round(profile.data.averageScore) : 0, suffix: '/ 100', icon: Award, color: 'text-chart-4' },
        ].map(({ label, value, suffix, icon: Icon, color }) => (
          <div className="rounded-2xl border border-border bg-card p-4" key={label} data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}>
            <Icon size={17} className={color} />
            <div className="mt-3 font-display text-2xl font-bold">{value}<span className="ml-1 font-mono text-[10px] font-normal text-muted-foreground">{suffix}</span></div>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Today only</p><h2 className="font-display text-2xl font-bold tracking-[-.04em]">The daily ten</h2></div>
          <span className="font-mono text-[11px] text-muted-foreground">{daily.data ? `${Math.ceil(daily.data.secondsUntilReset / 3600)}h left` : 'new set at midnight'}</span>
        </div>
        <div className="grid overflow-hidden rounded-[1.5rem] border border-border bg-card sm:grid-cols-[1.4fr_1fr]">
          <div className="relative overflow-hidden bg-secondary p-6 text-foreground sm:p-8">
            <div className="absolute -right-4 top-3 font-display text-[9rem] font-bold leading-none opacity-10">10</div>
            <Flame className="relative mb-8" size={27} />
            <h3 className="relative max-w-xs font-display text-3xl font-bold leading-[.95] tracking-[-.06em]">Keep the<br />run alive.</h3>
            <p className="relative mt-3 max-w-xs text-sm leading-5 opacity-70">Your daily set is waiting. One attempt per day, bragging rights included.</p>
            <button onClick={startDaily} className="pressable relative mt-7 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-extrabold text-background" data-testid="button-play-daily-card">Play today <ArrowRight size={16} /></button>
          </div>
          <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
            <div><span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Your best</span><div className="mt-1 font-display text-4xl font-bold">{daily.data?.bestScore ?? '—'}<span className="ml-2 font-mono text-xs font-normal text-muted-foreground">points</span></div></div>
            <div className="flex items-center gap-3 border-t border-border pt-5"><span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary"><Trophy size={17} /></span><p className="text-sm"><strong>{daily.data?.bestPosition ? `#${daily.data.bestPosition}` : 'Not ranked yet'}</strong><br /><span className="text-xs text-muted-foreground">among today&apos;s players</span></p></div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Find your flavor" title="Pick a category" action={<Link href="/categories" className="flex items-center gap-1 text-xs font-bold text-primary" data-testid="link-all-categories">All categories <ChevronRight size={15} /></Link>} />
        {isLoading ? <LoadingBlock label="Loading categories" /> : isError ? <ErrorBlock onRetry={() => void refetch()} /> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{categories.slice(0, 6).map((category) => <CategoryPill key={category.id} category={category} onClick={() => setLocation(`/play?category=${encodeURIComponent(category.id)}`)} />)}</div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-border bg-card p-5 sm:p-7">
        <SectionHeading eyebrow="Daily pulse" title="Top of the board" action={<Link href="/leaderboard" className="text-xs font-bold text-primary" data-testid="link-home-leaderboard">See all</Link>} />
        {ranks.isLoading ? <LoadingBlock label="Finding the sharpest minds" /> : ranks.isError ? <ErrorBlock onRetry={() => void ranks.refetch()} /> : topPlayers.length ? (
          <div className="space-y-2">{topPlayers.map((player, index) => <RankRow key={`${player.name}-${player.rank}`} player={player} highlight={index === 0} />)}</div>
        ) : <EmptyBlock title="The board is wide open" detail="Play today’s set to plant your name here." />}
      </section>
    </div>
  );
}

function RankRow({ player, highlight = false }: { player: LeaderboardEntry; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-3 ${player.isCurrentPlayer ? 'bg-primary/10 ring-1 ring-primary/20' : 'bg-background/45'}`} data-testid={`row-rank-${player.rank}`}>
      <span className={`w-6 text-center font-mono text-xs font-bold ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>{player.rank}</span>
      <span className="grid size-9 place-items-center rounded-full bg-foreground text-xs font-extrabold text-background">{player.avatar || player.name.slice(0, 1).toUpperCase()}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold">{player.name}{player.isCurrentPlayer && <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 font-mono text-[8px] uppercase text-primary-foreground">you</span>}</span>
      <span className="font-mono text-sm font-bold">{player.score}<span className="ml-1 text-[10px] font-normal text-muted-foreground">pts</span></span>
    </div>
  );
}

function PlayPage() {
  const { categories } = useCategoryData();
  const startGame = useStartGame();
  const track = useTrackAnalyticsEvent();
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] ?? '');
  const initialCategory = params.get('category') ?? '';
  const [mode, setMode] = useState<'quick' | 'daily'>(params.get('mode') === 'daily' ? 'daily' : 'quick');
  const [category, setCategory] = useState(initialCategory);

  const launch = () => {
    track.mutate({ data: { event: 'games_started', category: mode === 'daily' ? 'daily' : category || null } });
    if (category) track.mutate({ data: { event: 'category_selected', category } });
    startGame.mutate({ data: { mode, category: mode === 'quick' ? category || null : null } }, {
      onSuccess: (game) => {
        sessionStorage.setItem(`guess-game-${game.id}`, JSON.stringify(game));
        setLocation(`/game/${game.id}`);
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pt-6 sm:pt-12">
      <div><Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground" data-testid="link-back-home"><ArrowLeft size={15} /> Back home</Link><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Choose your arena</p><h1 className="mt-1 font-display text-5xl font-bold leading-none tracking-[-.07em] sm:text-6xl">Ready, set,<br /><span className="text-primary">guess.</span></h1></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={() => setMode('quick')} className={`pressable rounded-[1.5rem] border p-5 text-left ${mode === 'quick' ? 'border-foreground bg-foreground text-background' : 'border-border bg-card'}`} data-testid="button-mode-quick">
          <div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-2xl ${mode === 'quick' ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'}`}><Zap /></span>{mode === 'quick' && <Check size={18} />}</div>
          <h2 className="mt-7 font-display text-2xl font-bold">Quick play</h2><p className={`mt-1 text-sm ${mode === 'quick' ? 'text-background/60' : 'text-muted-foreground'}`}>Ten fresh questions. Choose your topic, chase your best.</p>
        </button>
        <button onClick={() => setMode('daily')} className={`pressable rounded-[1.5rem] border p-5 text-left ${mode === 'daily' ? 'border-foreground bg-secondary text-foreground' : 'border-border bg-card'}`} data-testid="button-mode-daily">
          <div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-foreground text-background"><Flame /></span>{mode === 'daily' && <Check size={18} />}</div>
          <h2 className="mt-7 font-display text-2xl font-bold">Daily challenge</h2><p className="mt-1 text-sm opacity-70">Same ten for everyone. One shot to climb the daily board.</p>
        </button>
      </div>
      {mode === 'quick' && <section><SectionHeading eyebrow="Optional, but fun" title="Pick a category" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{categories.map((item) => <CategoryPill key={item.id} category={item} selected={category === item.id} onClick={() => setCategory(category === item.id ? '' : item.id)} />)}</div></section>}
      <button disabled={startGame.isPending} onClick={launch} className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-extrabold text-primary-foreground disabled:opacity-60" data-testid="button-launch-game">{startGame.isPending ? <Loader2 className="animate-spin" size={19} /> : <Play size={19} fill="currentColor" />} {mode === 'daily' ? 'Start today’s challenge' : category ? `Play ${category}` : 'Start quick play'} <ArrowRight size={17} /></button>
      {startGame.isError && <ErrorBlock label="Could not start that run." onRetry={launch} />}
    </div>
  );
}

function GamePage() {
  const { gameId } = useParams<{ gameId?: string }>();
  const [location, setLocation] = useLocation();
  const game = useMemo<Game | null>(() => {
    if (!gameId) return null;
    try { return JSON.parse(sessionStorage.getItem(`guess-game-${gameId}`) ?? 'null') as Game | null; } catch { return null; }
  }, [gameId]);
  const params = game?.category ? { category: game.category as any, mode: 'quick' as const } : { mode: 'quick' as const };
  const quickQuestions = useListQuestions(params, { query: { enabled: !!game && game.mode !== 'daily', queryKey: getListQuestionsQueryKey(params) } });
  const daily = useGetDailyChallenge({ query: { enabled: !!game && game.mode === 'daily', queryKey: getGetDailyChallengeQueryKey() } });
  const complete = useCompleteGame();
  const completeRef = useRef(complete.mutate);
  completeRef.current = complete.mutate;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [scores, setScores] = useState<boolean[]>([]);
  const [seconds, setSeconds] = useState(15);
  const [startedAt] = useState(() => Date.now());
  const sourceQuestions = game?.mode === 'daily' ? daily.data?.questions : quickQuestions.data;
  const questions = useMemo(() => {
    if (!sourceQuestions || !game) return [];
    const byId = new Map(sourceQuestions.map((question) => [question.id, question]));
    return game.questionIds.map((id) => byId.get(id)).filter(Boolean) as Question[];
  }, [sourceQuestions, game]);

  const submit = useCallback((finalScores: boolean[]) => {
    if (!gameId || !game) return;
    const correctAnswers = finalScores.filter(Boolean).length;
    completeRef.current({ gameId: Number(gameId), data: { score: Math.round(correctAnswers / Math.max(finalScores.length, 1) * 100), correctAnswers, totalQuestions: Math.max(finalScores.length, 10), timeTaken: Math.round((Date.now() - startedAt) / 1000) } }, {
      onSuccess: (result) => {
        sessionStorage.setItem(`guess-result-${result.id}`, JSON.stringify(result));
        setLocation(`/result/${result.id}`);
      },
    });
  }, [game, gameId, setLocation, startedAt]);

  const choose = (choice: number) => {
    if (picked !== null || !questions[index]) return;
    const isCorrect = choice === questions[index].correctAnswerIndex;
    const nextScores = [...scores, isCorrect];
    setPicked(choice);
    setScores(nextScores);
    window.setTimeout(() => {
      if (index >= questions.length - 1) submit(nextScores);
      else { setIndex((value) => value + 1); setPicked(null); }
    }, 550);
  };

  useEffect(() => {
    if (picked !== null) return;
    setSeconds(15);
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [index, picked]);
  useEffect(() => {
    if (seconds <= 0 && picked === null && questions[index]) choose(-1);
  }, [seconds, picked, index, questions]);

  if (!game || (quickQuestions.isLoading || daily.isLoading)) return <div className="mx-auto max-w-2xl pt-16"><LoadingBlock label="Opening your run" /></div>;
  if (quickQuestions.isError || daily.isError) return <div className="mx-auto max-w-2xl pt-16"><ErrorBlock label="The questions took a wrong turn." onRetry={() => { void quickQuestions.refetch(); void daily.refetch(); }} /></div>;
  if (!questions.length) return <div className="mx-auto max-w-2xl pt-16"><EmptyBlock title="No questions yet" detail="This category is taking a tiny breather. Try another arena." /></div>;

  const question = questions[index];
  const isRight = picked === question.correctAnswerIndex;
  return (
    <div className="mx-auto max-w-3xl space-y-7 pt-4 sm:pt-10">
      <div className="flex items-center justify-between"><button onClick={() => setLocation('/play')} className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground" aria-label="Leave game" data-testid="button-leave-game"><X size={18} /></button><div className="text-center"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">{game.mode === 'daily' ? 'Daily challenge' : game.category || 'Quick play'}</p><p className="mt-1 font-display text-lg font-bold">Question {index + 1}<span className="text-muted-foreground"> / {questions.length}</span></p></div><div className={`grid size-10 place-items-center rounded-xl font-mono text-xs font-bold ${seconds <= 5 ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`} data-testid="status-timer"><Clock3 size={14} className="mb-0.5" />{seconds}</div></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(index / questions.length) * 100 + 10}%` }} /></div>
      <div className="rounded-[1.6rem] border border-border bg-card p-6 sm:p-10"><div className="mb-8 flex items-center justify-between"><span className="rounded-full bg-secondary px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[.13em]">{question.difficulty}</span><span className="font-mono text-xs text-muted-foreground">{Math.max(0, questions.length - index - 1)} to go</span></div><h1 className="font-display text-3xl font-bold leading-[1.05] tracking-[-.05em] sm:text-5xl" data-testid={`text-question-${question.id}`}>{question.question}</h1></div>
      <div className="grid gap-3 sm:grid-cols-2">{question.answers.map((answer, answerIndex) => { const correct = answerIndex === question.correctAnswerIndex; const chosen = answerIndex === picked; return <button key={answer} onClick={() => choose(answerIndex)} disabled={picked !== null} className={`pressable flex min-h-16 items-center gap-4 rounded-2xl border p-4 text-left text-sm font-bold sm:text-base ${chosen && correct ? 'answer-correct border-accent bg-accent/15' : chosen && !correct ? 'answer-wrong border-destructive bg-destructive/12' : picked !== null && correct ? 'border-accent bg-accent/15' : 'border-border bg-card hover:border-foreground'}`} data-testid={`button-answer-${answerIndex}`}><span className={`grid size-8 shrink-0 place-items-center rounded-xl font-mono text-xs ${chosen && !correct ? 'bg-destructive text-destructive-foreground' : correct && picked !== null ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{chosen && !correct ? <X size={15} /> : correct && picked !== null ? <Check size={15} /> : String.fromCharCode(65 + answerIndex)}</span><span>{answer}</span></button>; })}</div>
      {picked !== null && <div className={`animate-rise rounded-2xl p-4 text-sm ${isRight ? 'bg-accent/12' : 'bg-primary/12'}`} data-testid="status-answer-feedback"><div className="flex items-center gap-2 font-bold">{isRight ? <Check size={17} className="text-accent" /> : <Info size={17} className="text-primary" />}{isRight ? 'That’s it.' : `The answer was ${question.answers[question.correctAnswerIndex]}.`}</div><p className="mt-1 text-muted-foreground">{question.explanation}</p></div>}
    </div>
  );
}

function ResultPage() {
  const { resultId } = useParams<{ resultId?: string }>();
  const [location, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const track = useTrackAnalyticsEvent();
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const result = useMemo<GameResult | null>(() => { try { return JSON.parse(sessionStorage.getItem(`guess-result-${resultId}`) ?? 'null') as GameResult | null; } catch { return null; } }, [resultId]);
  const score = result?.score ?? profile.data?.bestScore ?? 0;
  const correct = result?.correctAnswers ?? Math.round(score / 10);
  const total = result?.totalQuestions ?? 10;
  const share = async () => {
    track.mutate({ data: { event: 'share_used', value: score } });
    const text = `I scored ${score}/100 on Guess It! Can you beat my run?`;
    if (navigator.share) await navigator.share({ title: 'My Guess It! score', text }).catch(() => undefined);
    else { await navigator.clipboard?.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  };
  return (
    <div className="mx-auto max-w-2xl space-y-7 pt-7 sm:pt-14">
      <div className="text-center"><div className="mx-auto mb-5 grid size-16 rotate-[-5deg] place-items-center rounded-[1.3rem] bg-secondary text-foreground shadow-[5px_5px_0_hsl(var(--foreground)/.1)]"><Trophy size={30} /></div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Run complete</p><h1 className="mt-2 font-display text-5xl font-bold tracking-[-.08em] sm:text-7xl">{result?.isNewBest ? 'New personal best.' : 'Nice little run.'}</h1><p className="mt-3 text-muted-foreground">{result?.isNewBest ? 'The bar just moved. Keep it there.' : 'Every answer makes the next one sharper.'}</p></div>
      <div className="relative overflow-hidden rounded-[1.8rem] bg-foreground p-7 text-background sm:p-10"><div className="absolute -right-8 -top-16 size-48 rounded-full border-[18px] border-primary/70" /><p className="relative font-mono text-[10px] uppercase tracking-[.2em] text-background/60">Your score</p><div className="relative mt-2 font-display text-8xl font-bold leading-none tracking-[-.1em] text-secondary" data-testid="text-result-score">{score}<span className="ml-2 text-2xl text-background/40">/100</span></div><div className="relative mt-7 grid grid-cols-3 gap-2 border-t border-background/15 pt-5">{[['Correct', `${correct}/${total}`], ['Accuracy', `${result?.accuracy ?? Math.round(correct / total * 100)}%`], ['Streak', `${result?.currentStreak ?? profile.data?.currentStreak ?? 0} days`]].map(([label, value]) => <div key={label}><p className="font-mono text-[10px] uppercase tracking-[.12em] text-background/50">{label}</p><p className="mt-1 font-display text-xl font-bold">{value}</p></div>)}</div></div>
      {!result && <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-xs text-muted-foreground" data-testid="status-result-fallback">Showing your latest known score. Play a run to unlock the full breakdown.</div>}
      <div className="grid gap-3 sm:grid-cols-2"><button onClick={share} className="pressable inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-extrabold text-primary-foreground" data-testid="button-share-result">{copied ? <Check size={18} /> : <Share2 size={18} />} {copied ? 'Copied score' : 'Share your score'}</button><Link href="/play" className="pressable inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-sm font-extrabold" data-testid="link-replay"><RotateCcw size={18} /> Play another</Link></div><Link href="/" className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground" data-testid="link-result-home"><ArrowLeft size={14} /> Back to hub</Link>
    </div>
  );
}

function CategoriesPage() {
  const { categories, isLoading, isError, refetch } = useCategoryData();
  const [, setLocation] = useLocation();
  return <div className="space-y-8 pt-6 sm:pt-12"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">The whole menu</p><h1 className="mt-1 font-display text-5xl font-bold tracking-[-.08em]">What&apos;s your<br /><span className="text-primary">territory?</span></h1><p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">A little bit of everything, none of it boring. Every lane is ten questions deep.</p></div>{isLoading ? <LoadingBlock label="Counting the good stuff" /> : isError ? <ErrorBlock onRetry={() => void refetch()} /> : <div className="grid gap-3 sm:grid-cols-2">{categories.map((category, index) => <button key={category.id} onClick={() => setLocation(`/play?category=${encodeURIComponent(category.id)}`)} className="pressable group flex items-center gap-4 rounded-[1.4rem] border border-border bg-card p-4 text-left" data-testid={`card-category-${category.id.replaceAll(' ', '-').toLowerCase()}`}><span className="grid size-14 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${category.accent}20`, color: category.accent }}>{iconForCategory(category.icon, 25)}</span><span className="flex-1"><span className="block font-display text-xl font-bold tracking-[-.04em]">{category.label}</span><span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{category.count} questions ready</span></span><span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground transition-transform group-hover:translate-x-1"><ChevronRight size={17} /></span><span className="absolute" /></button>)}</div>}</div>;
}

function LeaderboardPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'all-time'>('daily');
  const board = useListLeaderboards({ period }, { query: { queryKey: getListLeaderboardsQueryKey({ period }) } });
  return <div className="space-y-7 pt-6 sm:pt-12"><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Friendly competition</p><h1 className="mt-1 font-display text-5xl font-bold tracking-[-.08em]">The board.</h1></div><Trophy className="mb-1 text-secondary" size={38} /></div><div className="grid grid-cols-3 rounded-2xl bg-muted p-1">{(['daily', 'weekly', 'all-time'] as const).map((item) => <button key={item} onClick={() => setPeriod(item)} className={`rounded-xl px-2 py-3 font-mono text-[10px] font-bold uppercase tracking-[.08em] ${period === item ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground'}`} data-testid={`button-period-${item}`}>{item}</button>)}</div>{board.isLoading ? <LoadingBlock label="Finding the sharpest minds" /> : board.isError ? <ErrorBlock onRetry={() => void board.refetch()} /> : board.data?.length ? <div className="space-y-2">{board.data.map((player) => <RankRow key={`${period}-${player.rank}-${player.name}`} player={player} highlight={player.rank <= 3} />)}</div> : <EmptyBlock title="First place is yours" detail="No scores here yet. Start a run and make the board interesting." />}</div>;
}

function ProfilePage() {
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const update = useUpdateProfile();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [country, setCountry] = useState('');
  useEffect(() => { if (profile.data) { setName(profile.data.displayName); setAvatar(profile.data.avatar); setCountry(profile.data.country); } }, [profile.data]);
  const save = () => update.mutate({ data: { displayName: name.trim() || 'Player', avatar, country } }, { onSuccess: (next) => queryClient.setQueryData(getGetProfileQueryKey(), next) });
  if (profile.isLoading) return <div className="pt-12"><LoadingBlock label="Loading your player card" /></div>;
  if (profile.isError || !profile.data) return <div className="pt-12"><ErrorBlock onRetry={() => void profile.refetch()} /></div>;
  const data = profile.data;
  return <div className="space-y-8 pt-6 sm:pt-12"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Your player card</p><h1 className="mt-1 font-display text-5xl font-bold tracking-[-.08em]">Make it yours.</h1></div><section className="rounded-[1.6rem] border border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-4"><div className="grid size-16 place-items-center rounded-[1.3rem] bg-primary font-display text-2xl font-bold text-primary-foreground">{avatar || name.slice(0, 1).toUpperCase() || '?'}</div><div><p className="font-display text-2xl font-bold">{data.displayName}</p><p className="text-sm text-muted-foreground">{data.country || 'Anonymous challenger'}</p></div></div><div className="mt-7 grid gap-4 sm:grid-cols-3"><label className="space-y-2 text-xs font-bold">Display name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" data-testid="input-display-name" /></label><label className="space-y-2 text-xs font-bold">Avatar letters<input value={avatar} onChange={(event) => setAvatar(event.target.value)} maxLength={2} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" data-testid="input-avatar" /></label><label className="space-y-2 text-xs font-bold">Country code<input value={country} onChange={(event) => setCountry(event.target.value.toUpperCase())} maxLength={2} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" data-testid="input-country" /></label></div><button onClick={save} disabled={update.isPending} className="pressable mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-extrabold text-background disabled:opacity-60" data-testid="button-save-profile">{update.isPending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save changes</button>{update.isError && <p className="mt-3 text-xs text-destructive" data-testid="status-profile-error">Couldn&apos;t save that profile just yet.</p>}</section><section><SectionHeading eyebrow="The numbers" title="Your run history" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Games', data.totalGames], ['Best score', data.bestScore], ['Average', Math.round(data.averageScore)], ['Longest streak', `${data.longestStreak}d`]].map(([label, value]) => <div key={label} className="rounded-2xl border border-border bg-card p-4"><p className="font-display text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</div></section></div>;
}

function SettingsPage() {
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const update = useUpdateProfile();
  const queryClient = useQueryClient();
  const setPref = (key: 'soundOn' | 'musicOn' | 'darkMode' | 'notificationsOn', value: boolean) => {
    update.mutate({ data: { [key]: value } }, { onSuccess: (next) => { queryClient.setQueryData(getGetProfileQueryKey(), next); if (key === 'darkMode') document.documentElement.classList.toggle('dark', value); } });
  };
  const rows = profile.data ? [
    { key: 'soundOn' as const, title: 'Answer sounds', detail: 'A tiny chime for a tiny win.', icon: Volume2 },
    { key: 'musicOn' as const, title: 'Background music', detail: 'Low-key focus while you play.', icon: Music2 },
    { key: 'darkMode' as const, title: 'Night mode', detail: 'Deep ink, bright accents.', icon: Moon },
    { key: 'notificationsOn' as const, title: 'Daily nudge', detail: 'A gentle reminder before reset.', icon: Bell },
  ] : [];
  if (profile.isLoading) return <div className="pt-12"><LoadingBlock label="Loading preferences" /></div>;
  if (profile.isError || !profile.data) return <div className="pt-12"><ErrorBlock onRetry={() => void profile.refetch()} /></div>;
  return <div className="space-y-8 pt-6 sm:pt-12"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Tune the vibe</p><h1 className="mt-1 font-display text-5xl font-bold tracking-[-.08em]">Settings.</h1></div><section className="overflow-hidden rounded-[1.5rem] border border-border bg-card">{rows.map(({ key, title, detail, icon: Icon }) => <div key={key} className="flex items-center gap-4 border-b border-border p-4 last:border-0 sm:p-5"><span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground"><Icon size={18} /></span><span className="flex-1"><span className="block text-sm font-bold">{title}</span><span className="text-xs text-muted-foreground">{detail}</span></span><button onClick={() => setPref(key, !profile.data?.[key])} className={`relative h-7 w-12 rounded-full transition-colors ${profile.data?.[key] ? 'bg-primary' : 'bg-muted'}`} aria-label={`Toggle ${title}`} data-testid={`button-toggle-${key}`}><span className={`absolute top-1 size-5 rounded-full bg-background shadow-sm transition-transform ${profile.data?.[key] ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>)}</section><section className="overflow-hidden rounded-[1.5rem] border border-border bg-foreground p-5 text-background sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-secondary">Coming when you&apos;re ready</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-.06em]">Guess It! Premium</h2><p className="mt-2 max-w-md text-sm leading-6 text-background/65">A future home for no ads, extra themes, more hints, and premium categories. Payments are intentionally not connected yet.</p></div><Sparkles className="shrink-0 text-secondary" size={28} /></div><div className="mt-5 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-background/10 px-3 py-2">No ads</span><span className="rounded-full bg-background/10 px-3 py-2">Extra themes</span><span className="rounded-full bg-background/10 px-3 py-2">Extra hints</span></div><button disabled className="mt-6 rounded-xl bg-background/15 px-4 py-3 text-sm font-extrabold text-background/55" data-testid="button-premium-disabled">Payments not connected</button></section><section className="rounded-[1.5rem] border border-dashed border-border bg-card/60 p-5"><div className="flex items-start gap-3"><Info className="mt-0.5 text-primary" size={18} /><div><p className="text-sm font-bold">Monetization is off</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Banner, interstitial, and rewarded placements are isolated behind an AdService and stay disabled until an approved provider is configured.</p><p className="mt-2 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{adService.provider} provider · {adService.enabled ? 'enabled' : 'disabled'}</p></div></div></section><section className="grid gap-3 sm:grid-cols-3"><Link href="/privacy" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-bold" data-testid="link-privacy"><LockKeyhole size={18} className="text-primary" /> Privacy <ChevronRight className="ml-auto" size={16} /></Link><Link href="/terms" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-bold" data-testid="link-terms"><ShieldCheck size={18} className="text-accent" /> Terms <ChevronRight className="ml-auto" size={16} /></Link><div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-bold"><Info size={18} className="text-secondary" /> About <span className="ml-auto font-mono text-[10px] text-muted-foreground">v1.0.0</span></div></section></div>;
}

function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const title = kind === 'privacy' ? 'Privacy, plainly.' : 'The fine print.';
  return <div className="mx-auto max-w-2xl space-y-8 pt-8 sm:pt-16"><Link href="/settings" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground" data-testid="link-back-settings"><ArrowLeft size={15} /> Settings</Link><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">{kind === 'privacy' ? 'Your data, your call' : 'The rules of the game'}</p><h1 className="mt-1 font-display text-5xl font-bold tracking-[-.08em]">{title}</h1></div><article className="space-y-6 rounded-[1.5rem] border border-border bg-card p-6 text-sm leading-7 text-muted-foreground sm:p-9"><p>Guess It! is built for quick, anonymous play. We use a guest identifier to keep your profile, streaks, scores, and preferences together across sessions.</p><h2 className="font-display text-xl font-bold text-foreground">What we keep</h2><p>Your display name, optional avatar, country code, game results, and settings. We do not need your contacts, camera, or precise location to make the game work.</p><h2 className="font-display text-xl font-bold text-foreground">Playing nicely</h2><p>Keep scores honest, keep names kind, and remember that the best competition is the kind that makes you want one more round. These pages are a friendly placeholder for the complete policy.</p></article></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><AppShell><Switch><Route path="/" component={HomePage} /><Route path="/play" component={PlayPage} /><Route path="/game/:gameId" component={GamePage} /><Route path="/result/:resultId" component={ResultPage} /><Route path="/categories" component={CategoriesPage} /><Route path="/leaderboard" component={LeaderboardPage} /><Route path="/profile" component={ProfilePage} /><Route path="/settings" component={SettingsPage} /><Route path="/privacy"><LegalPage kind="privacy" /></Route><Route path="/terms"><LegalPage kind="terms" /></Route><Route component={NotFound} /></Switch></AppShell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;