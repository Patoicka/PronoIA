import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  XCircle,
  Crosshair,
  Brain,
  Globe2,
  Shield,
  LineChart,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { PageLoader } from '../components/ui/PageLoader';
import type { Match } from '../data/mockData';
import { mapApiMatch } from '../lib/mapApiMatch';
import {
  formatAccuracy,
  getDashboardStats,
  useMockDashboardStats,
  type DashboardStatsPeriod,
} from '../lib/dashboardStats';
import { MatchModal } from '../components/ui/MatchModal';
import { TeamCrest } from '../components/ui/TeamCrest';
import { LeagueMark } from '../components/ui/LeagueMark';

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8002').replace(/\/$/, '');
const HERO_IMG = '/images/hero/portada.jpg';

const DASHBOARD_LEAGUES: { name: string; id: number }[] = [
  { name: 'Premier League', id: 39 },
  { name: 'La Liga', id: 140 },
  { name: 'Serie A', id: 135 },
  { name: 'Bundesliga', id: 78 },
  { name: 'Ligue 1', id: 61 },
];

type Period = DashboardStatsPeriod;

function pickProb(m: Match): number {
  const mm = m.multiMarkets;
  if (!mm) return 0;
  if (m.pick === '1') return mm.win1;
  if (m.pick === '2') return mm.win2;
  return mm.draw;
}

function formatMatchWhen(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  );
}

async function fetchLeagueMatches(league: { name: string; id: number }): Promise<Match[]> {
  const res = await fetch(
    `${API_ROOT}/api/matches/live?league_id=${league.id}&days_ahead=45`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.detail === 'string' ? body.detail : `Error ${res.status} · ${league.name}`,
    );
  }
  const raw: unknown[] = await res.json();
  return raw
    .map((m) => mapApiMatch(m, league.name, league.id))
    .filter((m): m is Match => m !== null);
}

export const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [period, setPeriod] = useState<Period>('7d');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const settled = await Promise.allSettled(
          DASHBOARD_LEAGUES.map((l) => fetchLeagueMatches(l)),
        );
        if (cancelled) return;

        const ok: Match[] = [];
        settled.forEach((r) => {
          if (r.status === 'fulfilled') ok.push(...r.value);
        });

        if (!ok.length) {
          setAllMatches([]);
          setError('No se pudieron cargar las predicciones');
          return;
        }
        setAllMatches(ok);
      } catch (e: unknown) {
        if (cancelled) return;
        setAllMatches([]);
        setError(e instanceof Error ? e.message : 'No se pudo conectar con el servidor');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (location.hash !== '#metodologia') return;
    navigate('/metodologia', { replace: true });
  }, [location.hash, navigate]);

  const dashboardStats = useMemo(() => getDashboardStats(period), [period]);
  const showingDemoStats = useMockDashboardStats();

  const spotlight = useMemo(() => {
    const pool = allMatches.filter((m) => m.multiMarkets);
    if (!pool.length) return null;
    return [...pool].sort((a, b) => pickProb(b) - pickProb(a))[0];
  }, [allMatches]);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* —— Hero: altura por contenido, sin overflow que recorte el CTA —— */}
      <header className="fade-in relative full-bleed hero-compact">
        <div className="absolute inset-0 z-0" style={{ background: 'var(--bg)' }} aria-hidden />

        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden sm:block overflow-hidden"
          style={{ width: 'min(62%, 43rem)' }}
          aria-hidden
        >
          <img
            src={HERO_IMG}
            alt=""
            className="h-full w-full"
            style={{
              objectFit: 'cover',
              /* Más presencia (~15%) sin perder rostro / K de la camiseta */
              objectPosition: '66% 10%',
              transform: 'scale(1.15)',
              transformOrigin: '72% 18%',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(90deg, var(--bg) 0%, rgba(11,17,32,0.7) 12%, rgba(11,17,32,0.25) 32%, transparent 46%),
                linear-gradient(180deg, rgba(11,17,32,0.12) 0%, transparent 36%, rgba(11,17,32,0.42) 100%)
              `,
            }}
          />
        </div>

        <div
          className="absolute inset-0 z-0 sm:hidden"
          style={{
            backgroundImage: `url(${HERO_IMG})`,
            backgroundSize: 'cover',
            backgroundPosition: '70% 20%',
            opacity: 0.32,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 z-0 sm:hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,17,32,0.78) 0%, rgba(11,17,32,0.92) 60%, var(--bg) 100%)',
          }}
          aria-hidden
        />

        <div className="relative z-10 full-bleed-inner" style={{ isolation: 'isolate' }}>
          <div style={{ maxWidth: '46rem' }}>
            <p
              className="uppercase tracking-[0.2em] font-medium mb-2"
              style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}
            >
              Predicciones de fútbol
            </p>
            <h1
              className="text-brand mb-3"
              style={{
                fontSize: 'clamp(1.5rem, 2.7vw, 2.125rem)', /* ~24–34px: 2 líneas en desktop */
                lineHeight: 1.18,
                letterSpacing: '-0.028em',
                fontWeight: 800,
                color: 'var(--text)',
              }}
            >
              <span className="block sm:whitespace-nowrap">El fútbol tiene números.</span>
              <span className="block sm:whitespace-nowrap">
                <span style={{ color: 'var(--accent)' }}>Kronos</span> los interpreta.
              </span>
            </h1>
            <p
              className="mb-5"
              style={{
                color: 'var(--text-muted)',
                maxWidth: '32rem',
                fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
                lineHeight: 1.5,
              }}
            >
              Modelos estadísticos e IA para leer probabilidades con claridad — sin ruido, con señal.
            </p>
            <NavLink to="/predictions" className="btn-primary">
              Explorar predicciones
              <ArrowRight size={16} />
            </NavLink>
          </div>
        </div>
      </header>

      {/* —— Kronos en números —— */}
      <div className="fade-in stagger-1">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-title" style={{ fontSize: '1.25rem' }}>
              Kronos en números
            </h2>
            <p className="text-meta mt-0.5">
              Resultados y rendimiento de nuestras predicciones.
            </p>
          </div>
          <div
            className="flex gap-1 p-0.5"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '999px',
            }}
            role="tablist"
            aria-label="Periodo"
          >
            {(
              [
                { id: 'today' as const, label: 'Hoy' },
                { id: '7d' as const, label: 'Últimos 7 días' },
                { id: '30d' as const, label: 'Últimos 30 días' },
              ] as const
            ).map((p) => {
              const active = period === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPeriod(p.id)}
                  className="focus-ring px-3 py-1.5 text-meta font-semibold transition-colors whitespace-nowrap"
                  style={{
                    borderRadius: '999px',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    background: active ? 'var(--accent-bg)' : 'transparent',
                    border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BarChart3 size={24} strokeWidth={2} />}
            label="Predicciones"
            value={dashboardStats ? String(dashboardStats.totalPredictions) : '—'}
            hint={
              dashboardStats
                ? `${dashboardStats.evaluatedPredictions} evaluadas · ${dashboardStats.pendingPredictions} pendientes`
                : 'Sin datos'
            }
            tone="info"
          />
          <StatCard
            icon={<CheckCircle2 size={24} strokeWidth={2} />}
            label="Acertadas"
            value={dashboardStats ? String(dashboardStats.correctPredictions) : '—'}
            hint="Pronósticos correctos"
            tone="success"
          />
          <StatCard
            icon={<XCircle size={24} strokeWidth={2} />}
            label="Fallidas"
            value={dashboardStats ? String(dashboardStats.incorrectPredictions) : '—'}
            hint="Pronósticos incorrectos"
            tone="danger"
          />
          <StatCard
            icon={<Crosshair size={24} strokeWidth={2} />}
            label="Porcentaje de acierto"
            value={dashboardStats ? formatAccuracy(dashboardStats.accuracyPercentage) : '—'}
            hint={
              dashboardStats
                ? `Sobre ${dashboardStats.evaluatedPredictions} predicciones evaluadas`
                : 'Sin datos'
            }
            tone="accent"
          />
        </div>
        {showingDemoStats && (
          <p className="text-meta mt-3" style={{ color: 'var(--text-dim)' }}>
            Datos de demostración (solo desarrollo). Se sustituirán por el historial real cuando exista
            el endpoint.
          </p>
        )}
      </div>

      {/* —— Partido destacado —— */}
      <div className="fade-in stagger-2">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-title" style={{ fontSize: '1.25rem' }}>
              Partido destacado
            </h2>
            <p className="text-meta mt-0.5">
              Nuestro modelo con mayor confianza en el feed actual.
            </p>
          </div>
          <NavLink
            to="/predictions"
            className="inline-flex items-center gap-1 text-meta font-semibold focus-ring"
            style={{ color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
          >
            Ver todos los partidos
            <ArrowRight size={12} />
          </NavLink>
        </div>

        {loading && <PageLoader />}

        {!loading && error && (
          <div className="error-state">
            <p className="text-title" style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>
              No se pudieron cargar los partidos
            </p>
            <p className="text-meta">{error}</p>
          </div>
        )}

        {!loading && !error && spotlight && (
          <SpotlightCard match={spotlight} onOpen={() => setSelectedMatch(spotlight)} />
        )}

        {!loading && !error && !spotlight && (
          <div className="empty-state">
            <p className="text-meta">No hay predicciones disponibles ahora.</p>
          </div>
        )}
      </div>

      {/* —— Características —— */}
      <div
        id="metodologia"
        className="fade-in"
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '2rem',
          paddingBottom: '1.5rem',
        }}
      >
        <div className="feature-row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-0">
          {(
            [
              {
                icon: <LineChart size={22} strokeWidth={2} />,
                title: 'Modelos estadísticos',
                desc: 'Elo, ratings y análisis de datos.',
              },
              {
                icon: <Brain size={22} strokeWidth={2} />,
                title: 'Inteligencia artificial',
                desc: 'Modelos entrenados para evaluar información deportiva.',
              },
              {
                icon: <Globe2 size={22} strokeWidth={2} />,
                title: 'Cobertura de ligas',
                desc: 'Principales competiciones europeas disponibles.',
              },
              {
                icon: <Shield size={22} strokeWidth={2} />,
                title: 'Transparencia',
                desc: 'Probabilidades claras y metodología explicada.',
              },
            ] as const
          ).map((item) => (
            <div key={item.title} className="feature-item flex gap-3.5 px-1 lg:px-5">
              <span
                className="flex-shrink-0 rounded-full flex items-center justify-center"
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                {item.icon}
              </span>
              <div className="min-w-0">
                <p
                  className="font-semibold mb-1"
                  style={{ color: 'var(--text)', fontSize: '0.9375rem' }}
                >
                  {item.title}
                </p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem', lineHeight: 1.45 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MatchModal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch}
      />
    </section>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone?: 'info' | 'success' | 'muted' | 'accent' | 'danger';
}> = ({ icon, label, value, hint, tone = 'info' }) => {
  const iconColor =
    tone === 'success'
      ? 'var(--success)'
      : tone === 'danger'
        ? 'var(--danger)'
        : tone === 'muted'
          ? 'var(--text-dim)'
          : tone === 'accent'
            ? 'var(--accent)'
            : '#38BDF8'; /* azul discreto */

  const iconBg =
    tone === 'success'
      ? 'var(--success-bg)'
      : tone === 'danger'
        ? 'var(--danger-bg)'
        : tone === 'muted'
          ? 'rgba(123,139,165,0.12)'
          : tone === 'accent'
            ? 'var(--accent-bg)'
            : 'rgba(56,189,248,0.12)';

  return (
    <div
      className="surface-depth flex items-center gap-4 px-5 py-5"
      style={{
        borderRadius: '0.875rem',
        minHeight: '7.75rem',
      }}
    >
      <span
        className="flex-shrink-0 w-13 h-13 rounded-full flex items-center justify-center"
        style={{
          width: '3.25rem',
          height: '3.25rem',
          background: iconBg,
          color: iconColor,
        }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="font-semibold mb-1 truncate"
          style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}
        >
          {label}
        </p>
        <p
          className="text-mono font-bold"
          style={{
            fontSize: '1.875rem',
            lineHeight: 1.05,
            color: 'var(--text)',
            letterSpacing: '-0.03em',
          }}
        >
          {value}
        </p>
        <p className="mt-1.5 truncate" style={{ color: 'var(--text-dim)', fontSize: '0.78125rem' }}>
          {hint}
        </p>
      </div>
    </div>
  );
};

const SpotlightCard: React.FC<{ match: Match; onOpen: () => void }> = ({ match, onOpen }) => {
  const mm = match.multiMarkets!;
  const picks = [
    { key: '1', label: 'Local', value: mm.win1 },
    { key: 'X', label: 'Empate', value: mm.draw },
    { key: '2', label: 'Visita', value: mm.win2 },
  ] as const;
  const topValue = Math.max(mm.win1, mm.draw, mm.win2);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="surface-depth focus-ring w-full text-left transition-colors"
      style={{
        cursor: 'pointer',
        borderRadius: '1rem',
        padding: '1.5rem 1.6rem',
        minHeight: '10.5rem',
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-0">
        {/* Meta + logo de liga */}
        <div className="lg:w-[24%] lg:max-w-[14.5rem] flex-shrink-0">
          <div
            className="flex items-center gap-3.5 lg:border-r lg:pr-6"
            style={{ borderColor: 'var(--border)' }}
          >
            <LeagueMark league={match.league ?? ''} size={48} />
            <div className="min-w-0">
              <p
                className="font-semibold truncate"
                style={{ color: 'var(--text)', fontSize: '1rem' }}
              >
                {match.league ?? 'Liga'}
              </p>
              <p className="mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                {formatMatchWhen(match.sortDate)}
              </p>
              {match.matchday != null && (
                <p className="mt-0.5" style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                  Jornada {match.matchday}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Enfrentamiento: escudo arriba, nombre abajo */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-5 sm:gap-8 px-1 lg:px-6">
          <div className="flex flex-col items-center gap-3 min-w-0 flex-1">
            <TeamCrest src={match.homeLogo} name={match.home} size={68} rounded="lg" />
            <span
              className="font-semibold truncate text-center w-full"
              style={{ color: 'var(--text)', fontSize: 'clamp(0.875rem, 1.2vw, 1rem)' }}
            >
              {match.home}
            </span>
          </div>
          <span
            className="text-mono font-bold flex-shrink-0 self-center"
            style={{
              color: 'var(--text-dim)',
              fontSize: '0.8125rem',
              letterSpacing: '0.1em',
              marginBottom: '1.75rem',
            }}
          >
            VS
          </span>
          <div className="flex flex-col items-center gap-3 min-w-0 flex-1">
            <TeamCrest src={match.awayLogo} name={match.away} size={68} rounded="lg" />
            <span
              className="font-semibold truncate text-center w-full"
              style={{ color: 'var(--text)', fontSize: 'clamp(0.875rem, 1.2vw, 1rem)' }}
            >
              {match.away}
            </span>
          </div>
        </div>

        {/* Pronóstico */}
        <div className="lg:w-[30%] lg:min-w-[15.5rem] flex-shrink-0 flex items-center gap-3 lg:pl-5">
          <div
            className="hidden lg:block self-stretch w-px flex-shrink-0"
            style={{ background: 'var(--border)' }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="uppercase font-bold tracking-wider mb-2.5"
              style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}
            >
              Nuestra predicción
            </p>
            <div className="flex gap-2">
              {picks.map((p) => {
                const active = p.value === topValue;
                return (
                  <div
                    key={p.key}
                    className="flex-1 text-center px-2 py-2.5"
                    style={{
                      background: active ? 'var(--accent-bg)' : 'transparent',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '0.625rem',
                      minHeight: '3.75rem',
                    }}
                  >
                    <p
                      className="text-mono font-bold"
                      style={{
                        fontSize: 'clamp(1.05rem, 1.4vw, 1.2rem)',
                        lineHeight: 1.1,
                        color: active ? 'var(--accent)' : 'var(--text)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {p.value.toFixed(0)}%
                    </p>
                    <p
                      className="mt-1.5 font-semibold"
                      style={{
                        fontSize: '0.75rem',
                        color: active ? 'var(--accent)' : 'var(--text-dim)',
                      }}
                    >
                      {p.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <ChevronRight
            size={20}
            className="flex-shrink-0 hidden sm:block"
            style={{ color: 'var(--text-dim)' }}
            aria-hidden
          />
        </div>
      </div>
    </button>
  );
};
