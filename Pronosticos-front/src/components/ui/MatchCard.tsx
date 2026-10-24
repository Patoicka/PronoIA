import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Match } from '../../data/mockData';
import { uniqueTopPick } from '../../lib/matchRounds';
import { TeamCrest } from './TeamCrest';

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  index?: number;
  /** Muestra el nombre de liga (útil en listados multi-competición). */
  showLeague?: boolean;
  /** Si la fecha ya está en el encabezado del grupo, no repetirla. */
  hideDateInMeta?: boolean;
}

const ProbCell: React.FC<{ label: string; value: number; active: boolean }> = ({
  label,
  value,
  active,
}) => (
  <div
    className="flex-1 min-w-0 text-center flex flex-col items-center justify-center"
    style={{
      minWidth: '4.75rem',
      maxWidth: '5.5rem',
      height: '2.875rem',
      padding: '0.35rem 0.4rem',
      background: active ? 'var(--accent-bg)' : 'rgba(11, 17, 32, 0.4)',
      border: `1px solid ${active ? 'var(--accent-border)' : 'rgba(120, 150, 210, 0.14)'}`,
      borderRadius: '0.5rem',
    }}
  >
    <p
      className="text-mono font-bold leading-none"
      style={{
        fontSize: '1rem',
        color: active ? 'var(--accent)' : 'var(--text)',
      }}
    >
      {value.toFixed(0)}%
    </p>
    <p
      className="mt-1 font-semibold leading-none"
      style={{
        fontSize: '0.6875rem',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
      }}
    >
      {label}
    </p>
  </div>
);

function formatTime(iso?: string, fallback?: string): string {
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }
  }
  return fallback || '—';
}

function formatBriefDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '');
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onClick,
  index = 0,
  showLeague = false,
  hideDateInMeta = false,
}) => {
  const mm = match.multiMarkets;
  const top = mm ? uniqueTopPick(mm) : null;
  const time = formatTime(match.sortDate, match.time);
  const briefDate = hideDateInMeta ? '' : formatBriefDate(match.sortDate);

  return (
    <div
      role="button"
      tabIndex={0}
      className="match-list-row fade-in cursor-pointer focus-ring"
      style={{
        animationDelay: `${0.03 * index}s`,
        padding: '0.75rem 1.1rem',
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* —— Desktop / tablet: grid 15 / 50 / 35 —— */}
      <div className="match-row-grid hidden sm:grid w-full items-center">
        <div className="min-w-0">
          <p
            className="text-mono font-bold leading-none"
            style={{ fontSize: '1rem', color: match.live ? 'var(--success)' : 'var(--text)' }}
          >
            {match.live ? 'EN VIVO' : time}
          </p>
          {(briefDate || showLeague) && (
            <p className="mt-1 truncate text-meta" style={{ color: 'var(--text-muted)' }}>
              {showLeague && match.league ? match.league : briefDate}
            </p>
          )}
        </div>

        <div className="min-w-0 flex items-center justify-center gap-2.5 px-0.5">
          <div className="flex items-center justify-end gap-2.5 min-w-0" style={{ flex: '1 1 0' }}>
            <TeamCrest src={match.homeLogo} name={match.home} size={32} rounded="lg" />
            <span
              className="font-semibold truncate text-right leading-snug"
              style={{ color: 'var(--text)', fontSize: '0.9375rem' }}
              title={match.home}
            >
              {match.home}
            </span>
          </div>
          <span
            className="text-mono font-bold flex-shrink-0"
            style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}
          >
            VS
          </span>
          <div className="flex items-center justify-start gap-2.5 min-w-0" style={{ flex: '1 1 0' }}>
            <TeamCrest src={match.awayLogo} name={match.away} size={32} rounded="lg" />
            <span
              className="font-semibold truncate text-left leading-snug"
              style={{ color: 'var(--text)', fontSize: '0.9375rem' }}
              title={match.away}
            >
              {match.away}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex items-center justify-end gap-2">
          <div className="min-w-0 flex-1">
            <p
              className="uppercase font-semibold tracking-wide mb-1 text-right"
              style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}
            >
              Nuestra predicción
            </p>
            {mm ? (
              <div className="flex gap-1.5 justify-end">
                <ProbCell label="Local" value={mm.win1} active={top === '1'} />
                <ProbCell label="Empate" value={mm.draw} active={top === 'X'} />
                <ProbCell label="Visita" value={mm.win2} active={top === '2'} />
              </div>
            ) : (
              <p className="text-meta py-2 text-right" style={{ color: 'var(--text-muted)' }}>
                Sin predicción disponible
              </p>
            )}
          </div>
          <ChevronRight size={18} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden />
        </div>
      </div>

      {/* —— Mobile: apilado —— */}
      <div className="flex sm:hidden flex-col gap-2.5 w-full">
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-mono font-bold"
            style={{ fontSize: '0.9375rem', color: match.live ? 'var(--success)' : 'var(--text)' }}
          >
            {match.live ? 'EN VIVO' : time}
            {briefDate ? (
              <span className="font-medium ml-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {briefDate}
              </span>
            ) : null}
          </p>
          <div className="flex items-center gap-1.5 min-w-0">
            {showLeague && match.league && (
              <span className="text-meta truncate" style={{ color: 'var(--accent)' }}>
                {match.league}
              </span>
            )}
            <ChevronRight size={16} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center justify-end gap-2 min-w-0" style={{ flex: '1 1 0' }}>
            <TeamCrest src={match.homeLogo} name={match.home} size={30} rounded="lg" />
            <span
              className="font-semibold truncate text-right leading-snug"
              style={{ color: 'var(--text)', fontSize: '0.875rem' }}
              title={match.home}
            >
              {match.home}
            </span>
          </div>
          <span
            className="text-mono font-bold flex-shrink-0"
            style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}
          >
            VS
          </span>
          <div className="flex items-center justify-start gap-2 min-w-0" style={{ flex: '1 1 0' }}>
            <TeamCrest src={match.awayLogo} name={match.away} size={30} rounded="lg" />
            <span
              className="font-semibold truncate text-left leading-snug"
              style={{ color: 'var(--text)', fontSize: '0.875rem' }}
              title={match.away}
            >
              {match.away}
            </span>
          </div>
        </div>

        {mm ? (
          <div>
            <p
              className="uppercase font-semibold tracking-wide mb-1.5 text-center"
              style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}
            >
              Nuestra predicción
            </p>
            <div className="flex gap-1.5 justify-center">
              <ProbCell label="Local" value={mm.win1} active={top === '1'} />
              <ProbCell label="Empate" value={mm.draw} active={top === 'X'} />
              <ProbCell label="Visita" value={mm.win2} active={top === '2'} />
            </div>
          </div>
        ) : (
          <p className="text-meta text-center" style={{ color: 'var(--text-muted)' }}>
            Sin predicción disponible
          </p>
        )}
      </div>
    </div>
  );
};
