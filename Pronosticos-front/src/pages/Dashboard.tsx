import React, { useState, useEffect } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { Match } from '../data/mockData';
import { mapApiMatch } from '../lib/mapApiMatch';
import { MatchCard } from '../components/ui/MatchCard';
import { MatchModal } from '../components/ui/MatchModal';

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '');
const HOME_LEAGUE = 'Premier League';
const HOME_LEAGUE_ID = 39;

function firstJornadaMatches(matches: Match[]): Match[] {
  const withDay = matches.filter(m => m.matchday != null);
  if (!withDay.length) return matches.slice(0, 5);
  const min = Math.min(...withDay.map(m => m.matchday!));
  return matches.filter(m => m.matchday === min).slice(0, 5);
}

function nextMatchDate(matches: Match[]): string | null {
  const sorted = [...matches]
    .filter(m => m.sortDate)
    .sort((a, b) => (a.sortDate!).localeCompare(b.sortDate!));
  const next = sorted[0];
  if (!next?.sortDate) return null;
  return new Date(next.sortDate).toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export const Dashboard: React.FC = () => {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_ROOT}/api/matches/live?league_id=${HOME_LEAGUE_ID}&days_ahead=45`,
          { cache: 'no-store' },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body?.detail === 'string' ? body.detail : `Error ${res.status} al cargar partidos`,
          );
        }
        const raw: unknown[] = await res.json();
        if (cancelled) return;
        const mapped = raw
          .map(m => mapApiMatch(m, HOME_LEAGUE))
          .filter((m): m is Match => m !== null);
        setAllMatches(mapped);
      } catch (e: unknown) {
        if (cancelled) return;
        setAllMatches([]);
        setError(e instanceof Error ? e.message : 'No se pudo conectar con el servidor');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const featured = firstJornadaMatches(allMatches);
  const nextDate = nextMatchDate(allMatches);
  const jornadaLabel = featured[0]?.matchday
    ? `Jornada ${featured[0].matchday}`
    : 'Próximos partidos';

  return (
    <section className="stack-dense" style={{ gap: 'var(--space-section)' }}>
      {/* Hero — una composición: marca + promesa + CTA (sin KPI / pills) */}
      <header className="fade-in relative overflow-hidden -mx-[var(--space-page-x)] md:-mx-[var(--space-page-x-md)] px-[var(--space-page-x)] md:px-[var(--space-page-x-md)] py-8 md:py-10"
        style={{
          borderBottom: '1px solid var(--border)',
          background:
            'radial-gradient(ellipse 80% 70% at 70% 40%, rgba(245,158,11,0.10), transparent 55%)',
        }}
      >
        <p className="text-brand text-display mb-3">Kronos</p>
        <h1 className="text-title mb-2" style={{ fontSize: '1.25rem', maxWidth: '28rem' }}>
          Pronósticos de fútbol con señal clara
        </h1>
        <p className="text-body mb-5" style={{ color: 'var(--text-muted)', maxWidth: '28rem' }}>
          Probabilidades multi-mercado con Elo y modelos entrenados — para decidir con datos, no con ruido.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <NavLink
            to="/predictions"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Ver predicciones
            <ArrowRight size={16} />
          </NavLink>
          <span className="text-meta text-mono" style={{ color: 'var(--text-dim)' }}>
            {loading
              ? 'Cargando…'
              : error
                ? 'Sin datos en vivo'
                : nextDate
                  ? `Próximo · ${nextDate} · ${HOME_LEAGUE}`
                  : `${HOME_LEAGUE} · sin partidos próximos`}
          </span>
        </div>
      </header>

      {/* Lista densa — sin sidebar de relleno */}
      <div className="fade-in stagger-1 stack-dense">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-title">{jornadaLabel}</h2>
            <p className="text-meta mt-0.5">{HOME_LEAGUE}</p>
          </div>
          <NavLink
            to="/predictions"
            className="inline-flex items-center gap-1 text-meta font-semibold flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ color: 'var(--accent)' }}
          >
            Todas las ligas
            <ArrowRight size={12} />
          </NavLink>
        </div>

        {loading && (
          <div
            className="flex flex-col items-center justify-center gap-3 py-10"
            style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
          >
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-meta">Cargando predicciones…</p>
          </div>
        )}

        {!loading && error && (
          <div
            className="px-4 py-5"
            style={{
              border: '1px solid var(--border2)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
            }}
          >
            <p className="text-title" style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>
              No se pudieron cargar los partidos
            </p>
            <p className="text-meta" style={{ color: 'var(--text-muted)' }}>{error}</p>
            <p className="text-meta text-mono mt-2" style={{ color: 'var(--text-dim)' }}>
              API · {API_ROOT}
            </p>
          </div>
        )}

        {!loading && !error && featured.length === 0 && (
          <div
            className="px-4 py-8 text-center"
            style={{
              border: '1px dashed var(--border2)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p className="text-body" style={{ color: 'var(--text-muted)' }}>
              No hay partidos próximos en {HOME_LEAGUE}.
            </p>
            <NavLink
              to="/predictions"
              className="inline-flex items-center gap-1 mt-3 text-sm font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              Explorar otras ligas
              <ArrowRight size={14} />
            </NavLink>
          </div>
        )}

        {!loading && !error && featured.length > 0 && (
          <div className="stack-dense" style={{ gap: 'var(--space-2)' }}>
            {featured.map((m, i) => (
              <MatchCard
                key={`${m.home}-${m.away}-${m.sortDate ?? i}`}
                match={m}
                index={i}
                onClick={() => setSelectedMatch(m)}
              />
            ))}
          </div>
        )}
      </div>

      <MatchModal isOpen={!!selectedMatch} onClose={() => setSelectedMatch(null)} match={selectedMatch} />
    </section>
  );
};
