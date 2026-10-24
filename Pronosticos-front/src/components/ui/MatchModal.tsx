import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp } from 'lucide-react';
import { getTeamLogo } from '../../data/mockData';
import type { Match } from '../../data/mockData';
import { uniqueTopPick } from '../../lib/matchRounds';
import { TeamCrest } from './TeamCrest';
import { LeagueMark } from './LeagueMark';
import { humanStageLabel } from '../../lib/stageLabel';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
}

type TabId = '1x2' | 'goals' | 'team' | 'analysis';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ProbBar: React.FC<{
  label: string;
  value: number;
  color?: string;
  odd?: number;
}> = ({ label, value, color = 'var(--accent)', odd }) => (
  <div>
    <div className="flex justify-between items-center mb-1.5">
      <span className="text-meta" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        {odd != null && (
          <span className="badge-soft text-mono">x{odd.toFixed(2)}</span>
        )}
        <span className="text-sm font-bold text-mono" style={{ color }}>
          {value.toFixed(1)}%
        </span>
      </div>
    </div>
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border2)' }}>
      <div className="h-full rounded-full bar-fill" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  </div>
);

const CompareRow: React.FC<{
  label: string;
  left: number;
  right: number;
  format: (v: number) => string;
}> = ({ label, left, right, format }) => {
  const total = left + right;
  const leftPct = total > 0 ? (left / total) * 100 : 50;
  const leftWins = left >= right;
  return (
    <div
      className="rounded-[var(--radius-md)] p-3"
      style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-sm text-mono" style={{ color: leftWins ? 'var(--text)' : 'var(--text-muted)' }}>
          {format(left)}
        </span>
        <span className="text-meta uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <span className="font-bold text-sm text-mono" style={{ color: !leftWins ? 'var(--text)' : 'var(--text-muted)' }}>
          {format(right)}
        </span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${leftPct}%`, background: leftWins ? 'var(--accent)' : 'var(--text-dim)' }}
        />
        <div
          className="h-full rounded-full"
          style={{ width: `${100 - leftPct}%`, background: !leftWins ? 'var(--accent)' : 'var(--text-dim)' }}
        />
      </div>
    </div>
  );
};

function pickMeta(match: Match) {
  const mm = match.multiMarkets;
  if (!mm) return null;
  if (match.pick === '1') {
    return {
      label: match.home,
      code: '1',
      prob: mm.win1,
      odd: match.oddsRaw?.home,
    };
  }
  if (match.pick === '2') {
    return {
      label: match.away,
      code: '2',
      prob: mm.win2,
      odd: match.oddsRaw?.away,
    };
  }
  return {
    label: 'Empate',
    code: 'X',
    prob: mm.draw,
    odd: match.oddsRaw?.draw,
  };
}

/** El scroll real de la app vive en #app (Layout), no en window/body. */
function getScrollRoot(): HTMLElement {
  return (document.getElementById('app') as HTMLElement | null) ?? document.documentElement;
}

export const MatchModal: React.FC<MatchModalProps> = ({ isOpen, onClose, match }) => {
  const [tab, setTab] = useState<TabId>('1x2');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const scrollYRef = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const scrollRoot = getScrollRoot();
    scrollYRef.current = scrollRoot.scrollTop;

    scrollRoot.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    setTab('1x2');

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 40);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      scrollRoot.style.overflow = '';
      document.body.style.overflow = '';
      scrollRoot.scrollTop = scrollYRef.current;
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  const suggested = useMemo(() => {
    if (!match?.multiMarkets) return [];
    const mm = match.multiMarkets;
    const ext = match.extMarkets;
    const tr = match.totalsRaw;
    const bets: { label: string; desc: string; prob: number; odd?: number }[] = [];
    const addIf = (cond: boolean, b: (typeof bets)[0]) => {
      if (cond) bets.push(b);
    };

    addIf(mm.win1 >= 60, {
      label: `Victoria ${match.home}`,
      desc: '1',
      prob: mm.win1,
      odd: match.oddsRaw?.home,
    });
    addIf(mm.win2 >= 60, {
      label: `Victoria ${match.away}`,
      desc: '2',
      prob: mm.win2,
      odd: match.oddsRaw?.away,
    });
    addIf(mm.over25 >= 55, {
      label: 'Más de 2.5 goles',
      desc: 'Over 2.5',
      prob: mm.over25,
      odd: tr?.odd_over25,
    });
    addIf(mm.over25 < 55 && mm.over15 >= 70, {
      label: 'Más de 1.5 goles',
      desc: 'Over 1.5',
      prob: mm.over15,
      odd: tr?.odd_over15,
    });
    addIf(mm.dc1x >= 80, { label: `${match.home} o Empate`, desc: 'DC 1X', prob: mm.dc1x });
    addIf(mm.dcx2 >= 80, { label: `${match.away} o Empate`, desc: 'DC X2', prob: mm.dcx2 });
    if (ext) {
      addIf(ext.goals_home_over05 >= 85, {
        label: `${match.home} marca`,
        desc: '+0.5',
        prob: ext.goals_home_over05,
        odd: ext.odd_gh_over05,
      });
      addIf(ext.goals_away_over05 >= 85, {
        label: `${match.away} marca`,
        desc: '+0.5',
        prob: ext.goals_away_over05,
        odd: ext.odd_ga_over05,
      });
    }
    return bets.sort((a, b) => b.prob - a.prob).slice(0, 3);
  }, [match]);

  if (!isOpen || !match) return null;

  const mm = match.multiMarkets;
  const ext = match.extMarkets;
  const tr = match.totalsRaw;
  const pick = pickMeta(match);
  const topOutcome = mm ? uniqueTopPick(mm) : null;

  const matchDate = match.sortDate ? new Date(match.sortDate) : null;
  const dateStr = matchDate
    ? matchDate.toLocaleDateString('es', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const timeStr = matchDate
    ? matchDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    : match.time;

  const stageBit = match.stageLabel || match.stage
    ? ` · ${humanStageLabel(match.stage, match.stageLabel)}`
    : match.matchday
      ? ` · Jornada ${match.matchday}`
      : '';

  const tabs: { id: TabId; label: string; show: boolean }[] = [
    { id: '1x2', label: '1X2', show: !!mm },
    { id: 'goals', label: 'Goles', show: !!mm },
    { id: 'team', label: 'Equipos', show: !!(ext || (match.homePred && match.awayPred)) },
    {
      id: 'analysis',
      label: 'Análisis',
      show: !!(match.analysis || match.contextSummary || suggested.length),
    },
  ];
  const visibleTabs = tabs.filter((t) => t.show);
  const activeTab = visibleTabs.some((t) => t.id === tab) ? tab : (visibleTabs[0]?.id ?? '1x2');

  const dialog = (
    <div
      className="match-dialog-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        className="match-dialog-panel fade-in"
        style={{ animationDuration: '0.22s' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${match.home} vs ${match.away}`}
      >
        {/* Header fijo: competición → equipos → pick → tabs */}
        <div className="flex-shrink-0" style={{ borderBottom: '1px solid rgba(120, 150, 210, 0.14)' }}>
          <div className="px-4 pt-3.5 pb-3 sm:px-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0 flex items-center gap-2.5">
                {match.league ? <LeagueMark league={match.league} size={26} /> : null}
                <div className="min-w-0">
                  <p
                    className="text-meta text-mono uppercase tracking-wider truncate"
                    style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}
                  >
                    {match.league}
                    {stageBit}
                  </p>
                  <p className="text-meta truncate" style={{ color: 'var(--text-muted)' }}>
                    {dateStr}
                    {timeStr ? ` · ${timeStr}` : ''}
                  </p>
                </div>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="focus-ring p-2 rounded-lg transition-colors hover:bg-white/5 flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-5 mb-3">
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <TeamCrest src={match.homeLogo || getTeamLogo(match.home)} name={match.home} size={48} rounded="lg" />
                <span
                  className="font-semibold text-center leading-snug line-clamp-2 max-w-full"
                  style={{ color: 'var(--text)', fontSize: '0.875rem' }}
                >
                  {match.home}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                <span
                  className="text-mono font-bold"
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}
                >
                  VS
                </span>
                {match.live && (
                  <span
                    className="text-mono font-bold px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: '0.625rem',
                      background: 'var(--success-bg)',
                      color: 'var(--success)',
                      border: '1px solid rgba(16,185,129,0.3)',
                    }}
                  >
                    EN VIVO
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <TeamCrest src={match.awayLogo || getTeamLogo(match.away)} name={match.away} size={48} rounded="lg" />
                <span
                  className="font-semibold text-center leading-snug line-clamp-2 max-w-full"
                  style={{ color: 'var(--text)', fontSize: '0.875rem' }}
                >
                  {match.away}
                </span>
              </div>
            </div>

            {pick && (
              <div
                className="flex items-center justify-between gap-3 px-3 py-2"
                style={{
                  background: 'var(--accent-bg)',
                  border: '1px solid rgba(245, 158, 11, 0.28)',
                  borderRadius: '0.625rem',
                }}
              >
                <div className="min-w-0">
                  <p
                    className="uppercase font-semibold tracking-wide"
                    style={{ fontSize: '0.625rem', color: 'var(--accent)', letterSpacing: '0.05em' }}
                  >
                    Pick modelo · {pick.code}
                  </p>
                  <p className="text-sm font-semibold truncate leading-snug" style={{ color: 'var(--text)' }}>
                    {pick.label}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-mono leading-none" style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
                    {pick.prob.toFixed(1)}%
                  </p>
                  {pick.odd != null && (
                    <p className="text-meta text-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      x{pick.odd.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {visibleTabs.length > 1 && (
            <div
              className="flex gap-0 px-2 sm:px-3 overflow-x-auto hide-scrollbar"
              role="tablist"
              aria-label="Mercados del partido"
            >
              {visibleTabs.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className="focus-ring flex-1 min-w-[4.25rem] px-2 py-2.5 text-sm font-semibold transition-colors border-b-2"
                    style={{
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      borderColor: active ? 'var(--accent)' : 'transparent',
                      background: active ? 'rgba(245, 158, 11, 0.06)' : 'transparent',
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cuerpo con scroll interno */}
        <div className="match-dialog-body stack-dense" style={{ gap: 'var(--space-4)' }}>
          {activeTab === '1x2' && mm && (
            <>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-meta uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                  Resultado (1X2)
                </h4>
                {match.oddsRaw && (
                  <span className="badge-soft">{match.oddsRaw.bookmaker}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: '1' as const, label: match.home, value: mm.win1, odd: match.oddsRaw?.home },
                    { key: 'X' as const, label: 'Empate', value: mm.draw, odd: match.oddsRaw?.draw },
                    { key: '2' as const, label: match.away, value: mm.win2, odd: match.oddsRaw?.away },
                  ]
                ).map(({ key, label, value, odd }) => {
                  const active = topOutcome === key;
                  return (
                    <div
                      key={key}
                      className="text-center px-2 py-2.5"
                      style={{
                        background: active ? 'var(--accent-bg)' : 'rgba(11, 17, 32, 0.45)',
                        border: `1px solid ${active ? 'rgba(245, 158, 11, 0.32)' : 'rgba(120, 150, 210, 0.14)'}`,
                        borderRadius: '0.625rem',
                      }}
                    >
                      <p
                        className="font-semibold uppercase truncate mb-1"
                        style={{
                          fontSize: '0.6875rem',
                          color: active ? 'var(--accent)' : 'var(--text-muted)',
                        }}
                      >
                        {label}
                      </p>
                      <p
                        className="font-bold text-mono leading-none"
                        style={{
                          fontSize: '1.125rem',
                          color: active ? 'var(--accent)' : 'var(--text)',
                        }}
                      >
                        {value.toFixed(1)}%
                      </p>
                      <p
                        className="text-sm font-semibold text-mono mt-1.5"
                        style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
                      >
                        {odd
                          ? `x${odd.toFixed(2)}`
                          : value > 0
                            ? `x${(100 / value).toFixed(2)}`
                            : '—'}
                      </p>
                    </div>
                  );
                })}
              </div>
              {!match.oddsRaw && (
                <p className="text-meta text-center" style={{ color: 'var(--text-muted)' }}>
                  Cuotas estimadas por modelo · configura ODDS_API_KEY para cuotas reales
                </p>
              )}

              <h4 className="text-meta uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                Doble oportunidad
              </h4>
              <div className="stack-dense">
                <ProbBar label={`${match.home} o Empate`} value={mm.dc1x} color="var(--success)" />
                <ProbBar label={`${match.away} o Empate`} value={mm.dcx2} color="var(--success)" />
              </div>
            </>
          )}

          {activeTab === 'goals' && mm && (
            <>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-meta uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                  Mercado de goles
                </h4>
                {tr && <span className="badge-soft">Cuotas reales</span>}
              </div>
              <div className="stack-dense" style={{ gap: '0.75rem' }}>
                <ProbBar label="Más de 1.5 goles" value={mm.over15} odd={tr?.odd_over15} />
                <ProbBar label="Más de 2.5 goles" value={mm.over25} odd={tr?.odd_over25} />
                {ext && (
                  <ProbBar label="Más de 3.5 goles" value={ext.goals_over35} odd={tr?.odd_over35} />
                )}
              </div>

              {ext && (
                <>
                  <h4 className="text-meta uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                    Goles por equipo
                  </h4>
                  <div
                    className="overflow-hidden"
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div
                      className="grid grid-cols-[1fr_44px_1fr] px-3 py-2.5 gap-2"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <div>
                        <p className="text-meta font-bold truncate" style={{ color: 'var(--accent)' }}>
                          {match.home}
                        </p>
                        <p className="text-meta mt-0.5">
                          xG{' '}
                          <span className="text-mono font-bold" style={{ color: 'var(--text)' }}>
                            {ext.xg_home}
                          </span>
                        </p>
                      </div>
                      <div />
                      <div className="text-right">
                        <p className="text-meta font-bold truncate" style={{ color: 'var(--success)' }}>
                          {match.away}
                        </p>
                        <p className="text-meta mt-0.5">
                          xG{' '}
                          <span className="text-mono font-bold" style={{ color: 'var(--text)' }}>
                            {ext.xg_away}
                          </span>
                        </p>
                      </div>
                    </div>

                    {(
                      [
                        {
                          label: '+0.5',
                          hp: ext.goals_home_over05,
                          ho: ext.odd_gh_over05,
                          ap: ext.goals_away_over05,
                          ao: ext.odd_ga_over05,
                        },
                        {
                          label: '+1.5',
                          hp: ext.goals_home_over15,
                          ho: ext.odd_gh_over15,
                          ap: ext.goals_away_over15,
                          ao: ext.odd_ga_over15,
                        },
                        {
                          label: '+2.5',
                          hp: ext.goals_home_over25,
                          ho: ext.odd_gh_over25,
                          ap: ext.goals_away_over25,
                          ao: ext.odd_ga_over25,
                        },
                      ] as const
                    ).map((row) => (
                      <div key={row.label} className="px-3 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="grid grid-cols-[1fr_44px_1fr] gap-2 items-center mb-1.5">
                          <div className="text-right">
                            <span className="text-sm font-bold text-mono" style={{ color: 'var(--accent)' }}>
                              {row.hp.toFixed(1)}%
                            </span>
                            {row.ho != null && (
                              <span className="text-meta text-mono ml-1.5">x{row.ho.toFixed(2)}</span>
                            )}
                          </div>
                          <div className="flex justify-center">
                            <span className="badge-soft">{row.label}</span>
                          </div>
                          <div>
                            <span className="text-sm font-bold text-mono" style={{ color: 'var(--success)' }}>
                              {row.ap.toFixed(1)}%
                            </span>
                            {row.ao != null && (
                              <span className="text-meta text-mono ml-1.5">x{row.ao.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-[1fr_44px_1fr] gap-2">
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'var(--border2)', transform: 'scaleX(-1)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(row.hp, 100)}%`, background: 'var(--accent)' }}
                            />
                          </div>
                          <div />
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border2)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(row.ap, 100)}%`, background: 'var(--success)' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'team' && (
            <>
              {match.homePred && match.awayPred && (
                <>
                  <h4 className="text-meta uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                    Proyecciones modelo
                  </h4>
                  <div className="stack-dense" style={{ gap: '0.75rem' }}>
                    <CompareRow
                      label="xG"
                      left={match.homePred.expectedGoals}
                      right={match.awayPred.expectedGoals}
                      format={(v) => v.toFixed(1)}
                    />
                    <CompareRow
                      label="Posesión"
                      left={match.homePred.possession}
                      right={match.awayPred.possession}
                      format={(v) => `${v}%`}
                    />
                    <CompareRow
                      label="Tiros"
                      left={match.homePred.shots}
                      right={match.awayPred.shots}
                      format={(v) => `${v}`}
                    />
                  </div>
                </>
              )}
              {!match.homePred && !ext && (
                <div className="empty-state">
                  <p className="text-meta">No hay proyecciones de equipo para este partido.</p>
                </div>
              )}
              {ext && !match.homePred && (
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="px-3 py-3 text-center"
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <p className="text-meta mb-1">{match.home}</p>
                    <p className="text-lg font-bold text-mono" style={{ color: 'var(--accent)' }}>
                      xG {ext.xg_home}
                    </p>
                  </div>
                  <div
                    className="px-3 py-3 text-center"
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <p className="text-meta mb-1">{match.away}</p>
                    <p className="text-lg font-bold text-mono" style={{ color: 'var(--success)' }}>
                      xG {ext.xg_away}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'analysis' && (
            <>
              {suggested.length > 0 && (
                <>
                  <h4 className="text-meta uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                    Apuestas sugeridas
                  </h4>
                  <div className="stack-dense">
                    {suggested.map((bet, i) => {
                      const conf =
                        bet.prob >= 75
                          ? { label: 'Alta', color: 'var(--success)', bg: 'var(--success-bg)' }
                          : bet.prob >= 60
                            ? { label: 'Media', color: 'var(--accent)', bg: 'var(--accent-bg)' }
                            : { label: 'Moderada', color: 'var(--text-muted)', bg: 'var(--surface2)' };
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-3 py-2.5"
                          style={{
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                          }}
                        >
                          <div
                            className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center text-xs font-bold flex-shrink-0 text-mono"
                            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                          >
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>
                              {bet.label}
                            </p>
                            <p className="text-meta">
                              {bet.prob.toFixed(1)}%
                              {bet.odd != null ? ` · x${bet.odd.toFixed(2)}` : ''}
                            </p>
                          </div>
                          <span
                            className="text-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              fontSize: 'var(--text-label-size)',
                              background: conf.bg,
                              color: conf.color,
                            }}
                          >
                            {conf.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {(match.analysis || match.contextSummary) && (
                <div
                  className="px-3 py-3"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <p
                    className="text-meta uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5"
                    style={{ color: 'var(--accent)' }}
                  >
                    <TrendingUp size={12} /> Análisis modelo
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {match.analysis || match.contextSummary}
                  </p>
                </div>
              )}

              {!suggested.length && !match.analysis && !match.contextSummary && (
                <div className="empty-state">
                  <p className="text-meta">No hay análisis disponible para este partido.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};
