import React from 'react';
import { getLeagueLogo } from '../../lib/leagueLogo';

interface League {
  name: string;
  flag: string;
  id: string;
}

interface LeagueTabsProps {
  leagues: League[];
  selected: string;
  onSelect: (name: string) => void;
  /**
   * `underline` — pestañas con línea inferior (Predicciones).
   * `pill` — chips con borde (Ligas y usos legacy).
   */
  variant?: 'underline' | 'pill';
}

export const LeagueTabs: React.FC<LeagueTabsProps> = ({
  leagues,
  selected,
  onSelect,
  variant = 'underline',
}) => {
  if (variant === 'pill') {
    return (
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar" role="tablist" aria-label="Ligas">
        {leagues.map((l) => {
          const active = selected === l.name;
          const logo = getLeagueLogo(l.name);
          return (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(l.name)}
              className="focus-ring flex items-center gap-1.5 whitespace-nowrap transition-colors"
              style={{
                height: '2.625rem',
                paddingInline: '1rem',
                fontSize: 'var(--text-body-size)',
                fontWeight: 600,
                borderRadius: '0.625rem',
                background: active ? 'var(--accent-bg)' : 'var(--surface)',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {logo ? (
                <span
                  className="flex-shrink-0 overflow-hidden"
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: '999px',
                    background: '#fff',
                    padding: 1,
                  }}
                  aria-hidden
                >
                  <img src={logo} alt="" className="w-full h-full object-contain" />
                </span>
              ) : (
                <span className="text-sm leading-none" aria-hidden>
                  {l.flag}
                </span>
              )}
              {l.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="league-tabs" role="tablist" aria-label="Ligas">
      <div className="league-tabs__track hide-scrollbar">
        {leagues.map((l) => {
          const active = selected === l.name;
          const logo = getLeagueLogo(l.name);
          return (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(l.name)}
              className={`league-tabs__tab focus-ring${active ? ' is-active' : ''}`}
            >
              {logo ? (
                <span className="league-tabs__logo" aria-hidden>
                  <img src={logo} alt="" />
                </span>
              ) : (
                <span className="league-tabs__flag" aria-hidden>
                  {l.flag}
                </span>
              )}
              <span className="league-tabs__label">{l.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
