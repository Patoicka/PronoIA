import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { RoundOption } from '../../lib/matchRounds';

interface MatchRoundNavProps {
  rounds: RoundOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** Clave de la jornada “ancla” (actual/próxima con partidos), para etiquetas contextuales. */
  anchorKey?: string | null;
}

function contextBadge(
  key: string,
  anchorKey: string | null | undefined,
): string | null {
  if (!anchorKey) return null;
  return key === anchorKey ? 'Actual' : null;
}

/**
 * Ventana de jornadas reales (sin huecos vacíos).
 * Prioriza la seleccionada al centro cuando hay margen a ambos lados;
 * en los extremos rellena con las jornadas vecinas disponibles.
 */
function filledWindow(rounds: RoundOption[], selectedIdx: number, max: number): RoundOption[] {
  if (rounds.length <= max) return rounds;
  let start = selectedIdx - Math.floor((max - 1) / 2);
  if (start < 0) start = 0;
  if (start + max > rounds.length) start = rounds.length - max;
  return rounds.slice(start, start + max);
}

export const MatchRoundNav: React.FC<MatchRoundNavProps> = ({
  rounds,
  selectedKey,
  onSelect,
  anchorKey = null,
}) => {
  const [maxVisible, setMaxVisible] = useState(3);

  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 639px)');
    const mid = window.matchMedia('(min-width: 640px) and (max-width: 899px)');
    const sync = () => {
      if (narrow.matches) setMaxVisible(1);
      else if (mid.matches) setMaxVisible(2);
      else setMaxVisible(3);
    };
    sync();
    narrow.addEventListener('change', sync);
    mid.addEventListener('change', sync);
    return () => {
      narrow.removeEventListener('change', sync);
      mid.removeEventListener('change', sync);
    };
  }, []);

  if (!rounds.length) return null;

  const idx = Math.max(0, rounds.findIndex((r) => r.key === selectedKey));
  const selected = rounds[idx] ?? rounds[0];
  const visible = filledWindow(rounds, idx, maxVisible);
  const canPrev = idx > 0;
  const canNext = idx < rounds.length - 1;

  return (
    <nav aria-label="Jornadas" className="round-nav">
      <button
        type="button"
        className="round-nav__arrow focus-ring"
        disabled={!canPrev}
        aria-label="Jornada anterior"
        onClick={() => canPrev && onSelect(rounds[idx - 1].key)}
      >
        <ChevronLeft size={18} />
      </button>

      <div className="round-nav__chips">
        {visible.map((r) => {
          const active = r.key === selected.key;
          const badge = contextBadge(r.key, anchorKey);
          return (
            <button
              key={active ? `${r.key}-on` : r.key}
              type="button"
              className={`round-nav__chip focus-ring${active ? ' is-active is-pop' : ' is-side'}`}
              aria-current={active ? 'true' : undefined}
              onClick={() => onSelect(r.key)}
            >
              <span className="round-nav__chip-title">{r.label}</span>
              <span className="round-nav__chip-meta">
                {r.dateRange ?? '—'}
                {badge ? ` · ${badge}` : ''}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="round-nav__arrow focus-ring"
        disabled={!canNext}
        aria-label="Jornada siguiente"
        onClick={() => canNext && onSelect(rounds[idx + 1].key)}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
};
