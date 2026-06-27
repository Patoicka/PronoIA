import React from 'react';

interface League { name: string; flag: string; id: string; }

interface LeagueTabsProps {
  leagues: League[];
  selected: string;
  onSelect: (name: string) => void;
}

export const LeagueTabs: React.FC<LeagueTabsProps> = ({ leagues, selected, onSelect }) => (
  <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
    {leagues.map(l => {
      const active = selected === l.name;
      return (
        <button
          key={l.id}
          onClick={() => onSelect(l.name)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
          style={{
            background: active ? 'var(--accent-bg)' : 'var(--surface)',
            color: active ? 'var(--accent)' : 'var(--text-muted)',
            border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
          }}
        >
          <span className="text-base">{l.flag}</span>
          {l.name}
        </button>
      );
    })}
  </div>
);
