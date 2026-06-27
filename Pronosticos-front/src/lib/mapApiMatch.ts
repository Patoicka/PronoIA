import type { Match, ExtMarkets } from '../data/mockData';

function isKnownTeam(name: string): boolean {
  if (!name || name === '?') return false;
  const lower = name.toLowerCase();
  // Equipos sin confirmar del Mundial (ej. "Winner Match 49", "TBD")
  if (lower === 'tbd' || lower.startsWith('winner') || lower.startsWith('loser')) return false;
  return true;
}

export function mapApiMatch(m: any, league: string, leagueId?: number): Match | null {
  const x12 = m.markets?.['1x2'];
  if (!x12) return null;
  if (!isKnownTeam(m.home_team) || !isKnownTeam(m.away_team)) return null;

  const h = x12.home ?? 0;
  const d = x12.draw ?? 0;
  const a = x12.away ?? 0;
  const top = Math.max(h, d, a);
  const pick = top === d ? 'X' : top === h ? '1' : '2';
  const status = m.status as string | undefined;
  const isLive = !!status && !['NS', 'TBD', 'PST'].includes(status);

  return {
    home: m.home_team,
    away: m.away_team,
    homeLogo: m.home_logo || undefined,
    awayLogo: m.away_logo || undefined,
    time: new Date(m.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    matchday: typeof m.jornada === 'number' ? m.jornada : undefined,
    totalMatchdays: typeof m.total_jornadas === 'number' ? m.total_jornadas : undefined,
    stage: m.stage || undefined,
    stageLabel: m.stage_label || undefined,
    analysis: m.analysis || undefined,
    extMarkets:     m.ext_markets as ExtMarkets | undefined,
    leagueId,
    oddsRaw:        m.odds_raw ?? undefined,
    totalsRaw:      m.totals_raw ?? undefined,
    bttsRaw:        m.btts_raw ?? undefined,
    featuresSource: m.features_source,
    sortDate: m.date,
    conf: Math.round(top),
    pick,
    odds: top > 0 ? (100 / top).toFixed(2) : '—',
    league,
    live: isLive,
    multiMarkets: {
      win1: h,
      draw: d,
      win2: a,
      over15: m.markets.over15 ?? 0,
      over25: m.markets.over25 ?? 0,
      btts: m.markets.btts ?? 0,
      dc1x: m.markets.dc_1x ?? 0,
      dcx2: m.markets.dc_x2 ?? 0,
    },
  };
}
