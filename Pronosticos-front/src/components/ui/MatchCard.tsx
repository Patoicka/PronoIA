import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Match } from '../../data/mockData';

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  index?: number;
}

const TeamCrest: React.FC<{ src?: string; name: string }> = ({ src, name }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={28}
        height={28}
        className="object-contain flex-shrink-0 rounded-full p-0.5"
        style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.05)' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
      style={{ width: 28, height: 28, background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
};

const PickPill: React.FC<{ label: string; value: number; active: boolean }> = ({ label, value, active }) => (
  <div
    className="flex flex-col items-center px-2.5 py-1.5 rounded-lg"
    style={{
      background: active ? 'var(--accent-bg)' : 'var(--surface2)',
      border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
      minWidth: 48,
    }}
  >
    <span className="text-[9px] font-bold uppercase tracking-wide leading-none" style={{ color: active ? 'var(--accent)' : 'var(--text-dim)' }}>
      {label}
    </span>
    <span className="text-sm font-bold mt-0.5 leading-none" style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
      {value.toFixed(0)}%
    </span>
  </div>
);

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' · ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onClick, index = 0 }) => {
  const mm = match.multiMarkets;

  return (
    <div
      className="card fade-in cursor-pointer p-4"
      style={{ animationDelay: `${0.04 * index}s` }}
      onClick={onClick}
    >
      {/* Fila 1: Equipos */}
      <div className="flex items-center gap-2">
        {/* Local */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamCrest src={match.homeLogo} name={match.home} />
          <span className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
            {match.home}
          </span>
        </div>

        {/* VS */}
        <span className="text-xs font-mono flex-shrink-0 px-1" style={{ color: 'var(--text-dim)' }}>vs</span>

        {/* Visitante (invertido: nombre primero, crest al final) */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
          <TeamCrest src={match.awayLogo} name={match.away} />
          <span className="font-semibold text-sm truncate text-right flex-1 min-w-0" style={{ color: 'var(--text)' }}>
            {match.away}
          </span>
        </div>
      </div>

      {/* Fila 2: Fecha / estado */}
      <div className="flex items-center justify-between mt-2">
        {match.live ? (
          <span className="flex items-center gap-1.5 text-[11px] font-bold font-mono" style={{ color: 'var(--success)' }}>
            <span className="pulse-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--success)' }} />
            EN VIVO
          </span>
        ) : (
          <span className="text-[11px] font-mono" style={{ color: 'var(--text-dim)' }}>
            {formatDate(match.sortDate)}
          </span>
        )}
        {match.matchday && (
          <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
            J{match.matchday}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="my-3" style={{ borderTop: '1px solid var(--border)' }} />

      {/* Fila 3: Mercados */}
      <div className="relative flex items-center justify-center">
        {mm ? (
          <div className="flex gap-1.5">
            <PickPill label="Local" value={mm.win1} active={match.pick === '1'} />
            <PickPill label="Empate" value={mm.draw} active={match.pick === 'X'} />
            <PickPill label="Visita" value={mm.win2} active={match.pick === '2'} />
          </div>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Sin predicciones</span>
        )}
        <ChevronRight size={14} className="absolute right-0" style={{ color: 'var(--text-dim)' }} />
      </div>
    </div>
  );
};
