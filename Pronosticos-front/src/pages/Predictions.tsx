import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Calendar, ChevronDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { leaguesList } from '../data/mockData';
import type { Match } from '../data/mockData';
import { mapApiMatch } from '../lib/mapApiMatch';
import {
  buildRoundOptions,
  groupMatchesByDate,
  matchesForRound,
  pickDefaultRound,
} from '../lib/matchRounds';
import { LeagueTabs } from '../components/ui/LeagueTabs';
import { MatchCard } from '../components/ui/MatchCard';
import { MatchModal } from '../components/ui/MatchModal';
import { MatchRoundNav } from '../components/ui/MatchRoundNav';
import { PageLoader } from '../components/ui/PageLoader';

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8002').replace(/\/$/, '');

const DEFAULT_LEAGUE = 'Premier League';

function resolveLeague(param: string | null): string {
  if (param && leaguesList.some((l) => l.name === param)) return param;
  if (leaguesList.some((l) => l.name === DEFAULT_LEAGUE)) return DEFAULT_LEAGUE;
  return leaguesList[0].name;
}

const LEAGUE_IDS: Record<string, number> = {
  'La Liga': 140,
  'Premier League': 39,
  'Serie A': 135,
  'Bundesliga': 78,
  'Ligue 1': 61,
};

type SortMode = 'date' | 'conf';

export const Predictions: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLeague, setSelectedLeague] = useState(() =>
    resolveLeague(searchParams.get('league')),
  );
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roundKey, setRoundKey] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const fromUrl = resolveLeague(searchParams.get('league'));
    setSelectedLeague((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [searchParams]);

  const selectLeague = (name: string) => {
    setSelectedLeague(name);
    setRoundKey(null);
    setSearchParams(name === DEFAULT_LEAGUE ? {} : { league: name }, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = LEAGUE_IDS[selectedLeague] ?? 140;
        const res = await fetch(
          `${API_ROOT}/api/matches/live?league_id=${id}&days_ahead=90&_=${Date.now()}`,
          { cache: 'no-store' },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body?.detail === 'string' ? body.detail : `Error ${res.status}`,
          );
        }
        const raw: unknown[] = await res.json();
        if (!cancelled) {
          const lid = LEAGUE_IDS[selectedLeague];
          setMatches(
            raw
              .map((m) => mapApiMatch(m, selectedLeague, lid))
              .filter((m): m is Match => m !== null),
          );
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error desconocido';
        console.error('[Predictions] Error al cargar partidos:', msg, e);
        if (!cancelled) {
          setMatches([]);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedLeague, reloadToken]);

  const rounds = useMemo(() => buildRoundOptions(matches), [matches]);

  useEffect(() => {
    if (!rounds.length) {
      setRoundKey(null);
      return;
    }
    setRoundKey((prev) => {
      if (prev && rounds.some((r) => r.key === prev)) return prev;
      return pickDefaultRound(rounds, matches);
    });
  }, [rounds, matches]);

  const activeRound = useMemo(
    () => rounds.find((r) => r.key === roundKey) ?? null,
    [rounds, roundKey],
  );

  /** Jornada ancla (actual/próxima con partidos) — solo para etiquetas contextuales. */
  const anchorRoundKey = useMemo(
    () => (rounds.length ? pickDefaultRound(rounds, matches) : null),
    [rounds, matches],
  );

  const roundMatches = useMemo(() => {
    const list = matchesForRound(matches, activeRound);
    if (sortMode === 'conf') {
      return [...list].sort((a, b) => (b.conf ?? 0) - (a.conf ?? 0));
    }
    return [...list].sort((a, b) => (a.sortDate ?? '').localeCompare(b.sortDate ?? ''));
  }, [matches, activeRound, sortMode]);

  const dateGroups = useMemo(() => groupMatchesByDate(roundMatches), [roundMatches]);

  const goMetodologia = () => {
    navigate('/metodologia');
  };

  const goAdjacentRound = (dir: 1 | -1) => {
    if (!rounds.length || !roundKey) return;
    const i = rounds.findIndex((r) => r.key === roundKey);
    const next = rounds[i + dir];
    if (next) setRoundKey(next.key);
  };

  return (
    <section className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-title mb-0.5" style={{ fontSize: '1.5rem' }}>
            Predicciones
          </h1>
          <p className="text-meta" style={{ maxWidth: '36rem', color: 'var(--text-muted)' }}>
            Pronósticos de fútbol por liga, basados en modelos estadísticos e inteligencia artificial.
          </p>
        </div>
        <button
          type="button"
          onClick={goMetodologia}
          className="inline-flex items-center gap-1 text-meta font-semibold focus-ring"
          style={{ color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
        >
          Cómo funcionan las predicciones
          <ArrowRight size={12} />
        </button>
      </div>

      <LeagueTabs
        leagues={leaguesList}
        selected={selectedLeague}
        onSelect={selectLeague}
        variant="underline"
      />

      {loading && <PageLoader />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {!loading && !error && rounds.length > 0 && (
          <div className="predictions-round-bar">
            <div className="predictions-round-bar__center">
              <MatchRoundNav
                rounds={rounds}
                selectedKey={roundKey}
                onSelect={setRoundKey}
                anchorKey={anchorRoundKey}
              />
            </div>
            <label className="predictions-round-bar__sort relative">
              <span className="sr-only">Ordenar partidos</span>
              <Calendar
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden
              />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="field-input select-input !pl-8 !pr-8"
                style={{
                  height: '2.5rem',
                  width: 'auto',
                  minWidth: '10.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  background: 'var(--surface)',
                }}
              >
                <option value="date">Ordenar por fecha</option>
                <option value="conf">Mayor confianza</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden
              />
            </label>
          </div>
        )}

        {!loading && error && (
          <div className="error-state">
            <p className="text-title" style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>
              No se pudo cargar la información
            </p>
            <p className="text-meta" style={{ color: 'var(--text-muted)' }}>
              {error}
            </p>
            <button
              type="button"
              className="btn-primary mt-3"
              style={{ height: '2.25rem', paddingInline: '1rem', fontSize: '0.8125rem' }}
              onClick={() => setReloadToken((n) => n + 1)}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="empty-state">
            <p className="text-body" style={{ color: 'var(--text-muted)' }}>
              No hay partidos disponibles para {selectedLeague}.
            </p>
            <p className="text-meta mt-2">Prueba otra liga en las pestañas de arriba.</p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && roundMatches.length === 0 && (
          <div className="empty-state">
            <p className="text-body" style={{ color: 'var(--text-muted)' }}>
              No hay partidos en {activeRound?.label ?? 'esta jornada'}.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <button
                type="button"
                className="focus-ring px-3 py-1.5 text-meta font-semibold"
                style={{
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  background: 'var(--surface)',
                }}
                onClick={() => goAdjacentRound(-1)}
                disabled={!rounds.length || rounds.findIndex((r) => r.key === roundKey) <= 0}
              >
                Jornada anterior
              </button>
              <button
                type="button"
                className="focus-ring px-3 py-1.5 text-meta font-semibold"
                style={{
                  borderRadius: '0.5rem',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                  background: 'var(--accent-bg)',
                }}
                onClick={() => goAdjacentRound(1)}
                disabled={
                  !rounds.length ||
                  rounds.findIndex((r) => r.key === roundKey) >= rounds.length - 1
                }
              >
                Jornada siguiente
              </button>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          dateGroups.map((group) => (
            <div
              key={group.key}
              className="surface-depth overflow-hidden"
              style={{ borderRadius: '0.875rem' }}
            >
              <div
                className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3"
                style={{ borderBottom: '1px solid rgba(120, 150, 210, 0.14)' }}
              >
                <h2 className="font-semibold" style={{ color: 'var(--text)', fontSize: '0.9375rem' }}>
                  {group.label}
                </h2>
                <span className="text-meta text-mono" style={{ color: 'var(--text-muted)' }}>
                  {group.items.length} {group.items.length === 1 ? 'partido' : 'partidos'}
                </span>
              </div>
              <div className="flex flex-col">
                {group.items.map((m, i) => (
                  <MatchCard
                    key={`${group.key}-${m.home}-${m.away}-${m.sortDate ?? i}`}
                    match={m}
                    index={i}
                    hideDateInMeta
                    onClick={() => setSelectedMatch(m)}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>

      <MatchModal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch}
      />
    </section>
  );
};
