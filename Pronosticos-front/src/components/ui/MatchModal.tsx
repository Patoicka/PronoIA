import React from 'react';
import { X, TrendingUp } from 'lucide-react';
import { getTeamLogo } from '../../data/mockData';
import type { Match } from '../../data/mockData';

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '');

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

const TeamCrest: React.FC<{ src?: string; name: string }> = ({ src, name }) => {
  const imgSrc = src || getTeamLogo(name);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-1.5"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
        <img src={imgSrc} alt={name} className="w-full h-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
      </div>
      <span className="text-sm font-semibold text-center max-w-[100px] leading-tight" style={{ color: 'var(--text)' }}>
        {name}
      </span>
    </div>
  );
};

const ProbBar: React.FC<{ label: string; value: number; color?: string; odd?: number }> = ({ label, value, color = 'var(--accent)', odd }) => (
  <div>
    <div className="flex justify-between items-center mb-1.5">
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex items-center gap-2">
        {odd && (
          <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded-md"
            style={{ background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text)' }}>
            x{odd.toFixed(2)}
          </span>
        )}
        <span className="text-sm font-bold" style={{ color }}>{value.toFixed(1)}%</span>
      </div>
    </div>
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border2)' }}>
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
);

const StatPill: React.FC<{ label: string; value: string | number; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="flex flex-col items-center px-3 py-2 rounded-xl"
    style={{ background: accent ? 'var(--accent-bg)' : 'var(--surface2)', border: `1px solid ${accent ? 'var(--accent-border)' : 'var(--border)'}` }}>
    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accent ? 'var(--accent)' : 'var(--text-dim)' }}>{label}</span>
    <span className="text-sm font-black mt-0.5" style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
    {icon}{children}
  </h4>
);

const CompareRow: React.FC<{ label: string; left: number; right: number; format: (v: number) => string }> = ({ label, left, right, format }) => {
  const total = left + right;
  const leftPct = total > 0 ? (left / total) * 100 : 50;
  const leftWins = left >= right;
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div className="flex justify-between items-center mb-2.5">
        <span className="font-bold text-base" style={{ color: leftWins ? 'var(--text)' : 'var(--text-muted)' }}>{format(left)}</span>
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>{label}</span>
        <span className="font-bold text-base" style={{ color: !leftWins ? 'var(--text)' : 'var(--text-muted)' }}>{format(right)}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full" style={{ width: `${leftPct}%`, background: leftWins ? 'var(--accent)' : 'var(--text-dim)' }} />
        <div className="h-full rounded-full" style={{ width: `${100 - leftPct}%`, background: !leftWins ? 'var(--accent)' : 'var(--text-dim)' }} />
      </div>
    </div>
  );
};

// ── Modal principal ──────────────────────────────────────────────────────────

export const MatchModal: React.FC<MatchModalProps> = ({ isOpen, onClose, match }) => {
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !match) return null;

  const mm  = match.multiMarkets;
  const ext = match.extMarkets;
  const tr  = match.totalsRaw;
  const br  = match.bttsRaw;

  const matchDate = match.sortDate ? new Date(match.sortDate) : null;
  const dateStr   = matchDate ? matchDate.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const timeStr   = matchDate ? matchDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : match.time;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '20px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-dim)' }}>
                {match.league}
                {match.stageLabel ? ` · ${match.stageLabel}` : match.matchday ? ` · Jornada ${match.matchday}` : ''}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{dateStr} · {timeStr}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-white/5">
              <X size={20} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-6">
            <TeamCrest src={match.homeLogo} name={match.home} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black" style={{ color: 'var(--text-dim)' }}>vs</span>
              {match.live && (
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(22,163,74,0.3)' }}>
                  EN VIVO
                </span>
              )}
            </div>
            <TeamCrest src={match.awayLogo} name={match.away} />
          </div>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <>
              {/* 1X2 */}
              {mm && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionTitle>Resultado (1X2)</SectionTitle>
                    {match.oddsRaw && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full mb-3"
                        style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                        📊 {match.oddsRaw.bookmaker}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: '1', label: match.home, value: mm.win1, odd: match.oddsRaw?.home },
                      { key: 'X', label: 'Empate',   value: mm.draw, odd: match.oddsRaw?.draw },
                      { key: '2', label: match.away,  value: mm.win2, odd: match.oddsRaw?.away },
                    ].map(({ key, label, value, odd }) => (
                      <div key={key} className="rounded-xl p-3 text-center"
                        style={{
                          background: match.pick === key ? 'var(--accent-bg)' : 'var(--surface2)',
                          border: `1px solid ${match.pick === key ? 'var(--accent-border)' : 'var(--border)'}`,
                        }}>
                        <p className="text-[10px] font-bold uppercase truncate px-1 mb-1"
                          style={{ color: match.pick === key ? 'var(--accent)' : 'var(--text-muted)' }}>{label}</p>
                        <p className="text-xl font-black" style={{ color: match.pick === key ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {value.toFixed(1)}%
                        </p>
                        {/* Cuota decimal real del bookmaker */}
                        <p className="text-sm font-bold font-mono mt-1" style={{ color: match.pick === key ? 'var(--accent)' : 'var(--text)' }}>
                          {odd ? `x${odd.toFixed(2)}` : value > 0 ? `x${(100 / value).toFixed(2)}` : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                  {!match.oddsRaw && (
                    <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--text-dim)' }}>
                      ⚠️ Cuotas estimadas por IA · Configura ODDS_API_KEY para cuotas reales
                    </p>
                  )}
                </div>
              )}

              {/* Goles */}
              {mm && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionTitle>Mercado de goles</SectionTitle>
                    {tr && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full mb-3"
                        style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                        📊 Cuotas reales
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <ProbBar label="Más de 1.5 goles" value={mm.over15} odd={tr?.odd_over15} />
                    <ProbBar label="Más de 2.5 goles" value={mm.over25} odd={tr?.odd_over25} />
                    {ext && <ProbBar label="Más de 3.5 goles" value={ext.goals_over35} odd={tr?.odd_over35} />}
                  </div>
                </div>
              )}

              {/* Goles por equipo */}
              {ext && (
                <div>
                  <SectionTitle>Goles por equipo</SectionTitle>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-muted)' }}>{match.home}</p>
                      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>xG: <b style={{ color: 'var(--text)' }}>{ext.xg_home}</b></p>
                      <ProbBar label="+0.5" value={ext.goals_home_over05} color="var(--accent)" odd={ext.odd_gh_over05} />
                      <ProbBar label="+1.5" value={ext.goals_home_over15} color="var(--accent)" odd={ext.odd_gh_over15} />
                      <ProbBar label="+2.5" value={ext.goals_home_over25} color="var(--accent)" odd={ext.odd_gh_over25} />
                    </div>
                    <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-muted)' }}>{match.away}</p>
                      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>xG: <b style={{ color: 'var(--text)' }}>{ext.xg_away}</b></p>
                      <ProbBar label="+0.5" value={ext.goals_away_over05} color="var(--success)" odd={ext.odd_ga_over05} />
                      <ProbBar label="+1.5" value={ext.goals_away_over15} color="var(--success)" odd={ext.odd_ga_over15} />
                      <ProbBar label="+2.5" value={ext.goals_away_over25} color="var(--success)" odd={ext.odd_ga_over25} />
                    </div>
                  </div>
                </div>
              )}


              {/* Doble oportunidad */}
              {mm && (
                <div>
                  <SectionTitle>Doble oportunidad</SectionTitle>
                  <div className="space-y-2.5">
                    <ProbBar label={`${match.home} o Empate`} value={mm.dc1x} color="var(--success)" />
                    <ProbBar label={`${match.away} o Empate`} value={mm.dcx2} color="var(--success)" />
                  </div>
                </div>
              )}

              {/* Proyecciones comparativas */}
              {match.homePred && match.awayPred && (
                <div>
                  <SectionTitle>Proyecciones IA</SectionTitle>
                  <div className="space-y-3">
                    <CompareRow label="xG" left={match.homePred.expectedGoals} right={match.awayPred.expectedGoals} format={v => v.toFixed(1)} />
                    <CompareRow label="Posesión" left={match.homePred.possession} right={match.awayPred.possession} format={v => `${v}%`} />
                    <CompareRow label="Tiros" left={match.homePred.shots} right={match.awayPred.shots} format={v => `${v}`} />
                  </div>
                </div>
              )}

              {/* Análisis */}
              {(match.analysis || match.contextSummary) && (
                <div className="rounded-xl p-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                    <TrendingUp size={12} /> Análisis IA
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {match.analysis || match.contextSummary}
                  </p>
                </div>
              )}
          </>
        </div>
      </div>
    </div>
  );
};
