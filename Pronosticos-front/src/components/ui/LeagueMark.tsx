import React from 'react';
import { getLeagueLogo } from '../../lib/leagueLogo';

interface LeagueMarkProps {
  league: string;
  size?: number;
  className?: string;
}

/** Escudo/logo de liga en contenedor circular. */
export const LeagueMark: React.FC<LeagueMarkProps> = ({ league, size = 40, className = '' }) => {
  const src = getLeagueLogo(league);
  const pad = Math.max(4, Math.round(size * 0.12));

  if (!src) {
    return (
      <span
        className={`flex-shrink-0 flex items-center justify-center font-bold ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '999px',
          fontSize: Math.max(10, size * 0.28),
          background: 'var(--surface2)',
          color: 'var(--text-dim)',
          border: '1px solid var(--border)',
        }}
        aria-hidden
      >
        {league.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      className={`flex-shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '999px',
        background: '#fff',
        padding: pad,
        boxSizing: 'border-box',
      }}
    >
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </span>
  );
};
