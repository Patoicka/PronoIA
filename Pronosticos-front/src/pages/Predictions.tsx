import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { leaguesList } from '../data/mockData';
import type { Match } from '../data/mockData';
import { MatchCard } from '../components/ui/MatchCard';
import { MatchModal } from '../components/ui/MatchModal';

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '');

const LEAGUE_IDS: Record<string, number> = {
  'La Liga': 140,
  'Premier League': 39,
  'Serie A': 135,
  'Bundesliga': 78,
  'Ligue 1': 61,
};

function formatApiDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (typeof e === 'object' && e && 'msg' in e ? String((e as { msg: unknown }).msg) : JSON.stringify(e)))
      .join(' · ');
  }
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return '';
}

function groupMatchesByJornada(matches: Match[]): { jornada: number; total: number; items: Match[]; label: string }[] {
  const map = new Map<number, Match[]>();
  const sinJornada: Match[] = [];
  let defaultTotal = 38;
  for (const m of matches) {
    const j = m.matchday;
    if (m.totalMatchdays) defaultTotal = m.totalMatchdays;
    if (j == null || j < 1) {
      sinJornada.push(m);
      continue;
    }
    if (!map.has(j)) map.set(j, []);
    map.get(j)!.push(m);
  }
  const jornadas = [...map.keys()].sort((a, b) => a - b);
  const blocks = jornadas.map((j) => ({
    jornada: j,
    total: map.get(j)![0]?.totalMatchdays ?? defaultTotal,
    items: [...map.get(j)!].sort((a, b) => (a.sortDate || '').localeCompare(b.sortDate || '')),
    label: `Jornada ${j} de ${map.get(j)![0]?.totalMatchdays ?? defaultTotal}`,
  }));
  if (sinJornada.length > 0) {
    blocks.push({
      jornada: -1,
      total: defaultTotal,
      items: [...sinJornada].sort((a, b) => (a.sortDate || '').localeCompare(b.sortDate || '')),
      label: 'Próximos partidos',
    });
  }
  return blocks;
}

export const Predictions: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState(leaguesList[0].name);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  /** Etiqueta temporada API (p. ej. 2025/26), viene del backend forzado a la actual */
  const [apiSeasonLabel, setApiSeasonLabel] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const currentLeagueId = LEAGUE_IDS[selectedLeague] ?? 140;
        const url = `${API_ROOT}/api/matches/live?league_id=${currentLeagueId}&days_ahead=45&_=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          console.error('matches/live HTTP', response.status, errBody);
          setLiveMatches([]);
          setApiSeasonLabel(null);
          setFetchError(
            formatApiDetail(errBody?.detail) ||
              `Error del servidor (${response.status}). ¿Está corriendo el back en ${API_ROOT}?`
          );
          return;
        }
        const data = await response.json();
        const raw = Array.isArray(data) ? data : [];
        const seasonY = raw.find((r: { api_season?: number }) => typeof r?.api_season === 'number')?.api_season;
        setApiSeasonLabel(
          typeof seasonY === 'number' ? `${seasonY}/${String(seasonY + 1).slice(-2)}` : null
        );

        const formattedMatches: Match[] = raw
          .map((m: any): Match | null => {
            const x12 = m.markets?.['1x2'];
            if (!x12) return null;
            const h = x12.home ?? 0;
            const d = x12.draw ?? 0;
            const a = x12.away ?? 0;
            const top = Math.max(h, d, a);
            const pick = top === d ? 'X' : top === h ? '1' : '2';
            const status = m.status as string | undefined;
            const isLive = status && !['NS', 'TBD', 'PST'].includes(status);

            return {
              home: m.home_team,
              away: m.away_team,
              time: new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              matchday: typeof m.jornada === 'number' ? m.jornada : undefined,
              totalMatchdays: typeof m.total_jornadas === 'number' ? m.total_jornadas : undefined,
              sortDate: m.date,
              conf: Math.round(top),
              pick,
              odds: top > 0 ? (100 / top).toFixed(2) : '—',
              league: selectedLeague,
              live: !!isLive,
              multiMarkets: {
                win1: x12.home,
                draw: x12.draw,
                win2: x12.away,
                over15: m.markets.over15 ?? 0,
                over25: m.markets.over25 ?? 0,
                btts: m.markets.btts ?? 0,
                dc1x: m.markets.dc_1x ?? 0,
                dcx2: m.markets.dc_x2 ?? 0,
              },
            };
          })
          .filter((row): row is Match => row != null);
        
        setLiveMatches(formattedMatches);
      } catch (error) {
        console.error("Error fetching live matches", error);
        setLiveMatches([]);
        setApiSeasonLabel(null);
        setFetchError('No se pudo conectar con el backend.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMatches();
  }, [selectedLeague]);

  const leagueMatches = liveMatches;
  const byJornada = useMemo(() => groupMatchesByJornada(leagueMatches), [leagueMatches]);

  return (
    <section className="space-y-6">
      <div className="fade-in">
        <h1 className="text-3xl font-extrabold mb-2 text-white">Predicciones por Liga</h1>
        <p style={{ color: '#888' }}>Selecciona una liga para ver los pronósticos y el cara a cara de los próximos partidos.</p>
      </div>

      {/* Navegación de Ligas Superior */}
      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
        {leaguesList.map((l) => (
          <button 
            key={l.id}
            onClick={() => setSelectedLeague(l.name)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap shadow-sm"
            style={{ 
              background: selectedLeague === l.name ? 'linear-gradient(135deg, #c85000, #a04000)' : '#141414', 
              color: selectedLeague === l.name ? '#fff' : '#888',
              border: selectedLeague === l.name ? '1px solid #c85000' : '1px solid #1e1e1e'
            }}
          >
            <span className="text-lg">{l.flag}</span>
            {l.name}
          </button>
        ))}
      </div>

      {/* Lista de Partidos */}
      <div className="fade-in rounded-2xl p-6" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy size={20} color="#c85000" /> Próximos Partidos - {selectedLeague}
            </h2>
          </div>
          {apiSeasonLabel && !isLoading && (
            <p className="text-xs font-mono mt-2" style={{ color: '#555' }}>
              Temporada {apiSeasonLabel} (API-Football, temporada actual)
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c85000' }} />
            <p className="mt-4 font-mono text-sm" style={{ color: '#888' }}>Conectando con API-Football...</p>
            <p className="mt-1 font-mono text-xs" style={{ color: '#555' }}>Generando predicciones en tiempo real</p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-12 rounded-xl" style={{ border: '1px solid #3a2020', background: '#1a1010' }}>
            <p className="text-sm font-medium" style={{ color: '#c85000' }}>{fetchError}</p>
            <p className="text-xs mt-2 font-mono" style={{ color: '#666' }}>Reinicia uvicorn en Pronosticos-back y revisa API_FOOTBALL_KEY / API_FOOTBALL_SEASON en .env</p>
          </div>
        ) : leagueMatches.length > 0 ? (
          <div className="flex flex-col space-y-8">
            {byJornada.map((block) => (
              <div key={block.jornada} className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#888' }}>
                  {block.label}
                </h3>
                <div className="flex flex-col space-y-3">
                  {block.items.map((m, i) => (
                    <MatchCard
                      key={`${block.jornada}-${m.sortDate}-${m.home}-${i}`}
                      match={m}
                      variant="list"
                      onClick={() => setSelectedMatch(m)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12" style={{ border: '1px dashed #1e1e1e', borderRadius: '12px' }}>
            <p style={{ color: '#888' }}>No hay partidos programados próximamente para {selectedLeague}.</p>
          </div>
        )}
      </div>

      <MatchModal 
        isOpen={!!selectedMatch} 
        onClose={() => setSelectedMatch(null)} 
        match={selectedMatch}
      />
    </section>
  );
};
