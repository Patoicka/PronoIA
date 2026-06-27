import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { leaguesList } from '../data/mockData';
import type { Match } from '../data/mockData';
import { mapApiMatch } from '../lib/mapApiMatch';
import { LeagueTabs } from '../components/ui/LeagueTabs';
import { MatchCard } from '../components/ui/MatchCard';
import { MatchModal } from '../components/ui/MatchModal';

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '');

const LEAGUE_IDS: Record<string, number> = {
  'Mundial 2026':   1,
  'La Liga':        140,
  'Premier League': 39,
  'Serie A':        135,
  'Bundesliga':     78,
  'Ligue 1':        61,
};

// Para el Mundial agrupamos por fase (stage); para ligas, por jornada numérica.
type Block = { key: string; label: string; items: Match[] };

function groupMatches(matches: Match[]): Block[] {
  const isWC = matches.some(m => m.stage);

  if (isWC) {
    // Agrupar por stage, respetando el orden de aparición
    const order: string[] = [];
    const map = new Map<string, Match[]>();

    for (const m of matches) {
      const stage = m.stage ?? 'OTHER';
      if (!map.has(stage)) { map.set(stage, []); order.push(stage); }
      map.get(stage)!.push(m);
    }

    return order.map(stage => ({
      key: stage,
      label: matches.find(m => m.stage === stage)?.stageLabel ?? stage,
      items: (map.get(stage) ?? []).sort((a, b) => (a.sortDate ?? '').localeCompare(b.sortDate ?? '')),
    }));
  }

  // Ligas normales: agrupar por jornada numérica
  let total = 38;
  const map = new Map<number, Match[]>();
  const noMatchday: Match[] = [];

  for (const m of matches) {
    if (m.totalMatchdays) total = m.totalMatchdays;
    const j = m.matchday;
    if (j == null || j < 1) { noMatchday.push(m); continue; }
    if (!map.has(j)) map.set(j, []);
    map.get(j)!.push(m);
  }

  const blocks: Block[] = [...map.keys()].sort((a, b) => a - b).map(j => {
    const jTotal = map.get(j)![0]?.totalMatchdays ?? total;
    return {
      key: String(j),
      label: `Jornada ${j} de ${jTotal}`,
      items: map.get(j)!.sort((a, b) => (a.sortDate ?? '').localeCompare(b.sortDate ?? '')),
    };
  });

  if (noMatchday.length) blocks.push({ key: 'none', label: 'Próximos partidos', items: noMatchday });
  return blocks;
}

export const Predictions: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState(leaguesList[0].name);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = LEAGUE_IDS[selectedLeague] ?? 140;
        const res = await fetch(`${API_ROOT}/api/matches/live?league_id=${id}&days_ahead=90&_=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail || `Error ${res.status}`);
        }
        const raw: any[] = await res.json();
        if (!cancelled) {
          const lid = LEAGUE_IDS[selectedLeague];
          setMatches(raw.map(m => mapApiMatch(m, selectedLeague, lid)).filter((m): m is Match => m !== null));
        }
      } catch (e: any) {
        const msg = e.message ?? 'Error desconocido';
        console.error('[Predictions] Error al cargar partidos:', msg, e);
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedLeague]);

  const blocks = useMemo(() => groupMatches(matches), [matches]);

  return (
    <section className="space-y-5">
      <div className="fade-in">
        <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>Predicciones</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Selecciona una liga para ver los pronósticos de la IA en tiempo real.
        </p>
      </div>

      <LeagueTabs leagues={leaguesList} selected={selectedLeague} onSelect={setSelectedLeague} />

      <div className="card p-5 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>{selectedLeague}</h2>
          <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
            {matches.length > 0 ? `${matches.length} partidos` : 'Datos en tiempo real'}
          </span>
        </div>

        {/* States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando partidos…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl p-5 text-center" style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>
              No se pudo cargar la información. Revisa la consola para más detalles.
            </p>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed var(--border2)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No hay partidos disponibles para {selectedLeague}.</p>
          </div>
        )}

        {!loading && !error && blocks.map((block, bi) => (
          <div key={block.key} className={bi > 0 ? 'mt-8' : ''}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                {block.label}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{block.items.length} partidos</span>
            </div>
            <div className="space-y-2">
              {block.items.map((m, i) => (
                <MatchCard
                  key={`${block.key}-${i}`}
                  match={m}
                  index={i}
                  onClick={() => setSelectedMatch(m)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <MatchModal isOpen={!!selectedMatch} onClose={() => setSelectedMatch(null)} match={selectedMatch} />
    </section>
  );
};
