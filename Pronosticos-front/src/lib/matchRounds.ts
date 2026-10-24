import type { Match } from '../data/mockData';
import { humanStageLabel } from './stageLabel';

export type RoundOption = {
  /** Identificador estable: `md:9`, `stage:GROUP_STAGE`, `bucket:none`. */
  key: string;
  label: string;
  /** Rango de fechas corto, p. ej. "24–26 oct". */
  dateRange?: string;
  matchday?: number;
  stage?: string;
};

function formatShortRange(dates: string[]): string | undefined {
  const parsed = dates
    .map((iso) => new Date(iso))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (!parsed.length) return undefined;

  const first = parsed[0];
  const last = parsed[parsed.length - 1];
  const sameDay =
    first.getFullYear() === last.getFullYear() &&
    first.getMonth() === last.getMonth() &&
    first.getDate() === last.getDate();

  const dayMonth = (d: Date) =>
    d.toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '');

  if (sameDay) return dayMonth(first);
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}–${last.getDate()} ${first.toLocaleDateString('es', { month: 'short' }).replace('.', '')}`;
  }
  return `${dayMonth(first)} – ${dayMonth(last)}`;
}

function datesOf(items: Match[]): string[] {
  return items.map((m) => m.sortDate).filter((d): d is string => !!d);
}

/** Construye opciones de jornada/fase a partir de los partidos de una liga. */
export function buildRoundOptions(matches: Match[]): RoundOption[] {
  const hasMatchdays = matches.some((m) => m.matchday != null && m.matchday >= 1);
  const isTournamentStages = !hasMatchdays && matches.some((m) => !!m.stage);

  if (isTournamentStages) {
    const order: string[] = [];
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      const stage = m.stage ?? 'OTHER';
      if (!map.has(stage)) {
        map.set(stage, []);
        order.push(stage);
      }
      map.get(stage)!.push(m);
    }
    return order.map((stage) => {
      const items = map.get(stage) ?? [];
      const sample = items[0];
      return {
        key: `stage:${stage}`,
        label: humanStageLabel(stage, sample?.stageLabel),
        dateRange: formatShortRange(datesOf(items)),
        stage,
      };
    });
  }

  const map = new Map<number, Match[]>();
  const noMatchday: Match[] = [];

  for (const m of matches) {
    const j = m.matchday;
    if (j == null || j < 1) {
      noMatchday.push(m);
      continue;
    }
    if (!map.has(j)) map.set(j, []);
    map.get(j)!.push(m);
  }

  const rounds: RoundOption[] = [...map.keys()]
    .sort((a, b) => a - b)
    .map((j) => {
      const items = map.get(j)!;
      return {
        key: `md:${j}`,
        label: `Jornada ${j}`,
        dateRange: formatShortRange(datesOf(items)),
        matchday: j,
      };
    });

  if (noMatchday.length) {
    rounds.push({
      key: 'bucket:none',
      label: 'Próximos partidos',
      dateRange: formatShortRange(datesOf(noMatchday)),
    });
  }

  return rounds;
}

export function matchesForRound(matches: Match[], round: RoundOption | null): Match[] {
  if (!round) return [];
  if (round.key.startsWith('md:') && round.matchday != null) {
    return matches.filter((m) => m.matchday === round.matchday);
  }
  if (round.key.startsWith('stage:') && round.stage) {
    return matches.filter((m) => (m.stage ?? 'OTHER') === round.stage);
  }
  if (round.key === 'bucket:none') {
    return matches.filter((m) => m.matchday == null || m.matchday < 1);
  }
  return [];
}

/**
 * Jornada actual o próxima con partidos pendientes;
 * si no hay futuros, la última disponible.
 */
export function pickDefaultRound(rounds: RoundOption[], matches: Match[]): string | null {
  if (!rounds.length) return null;
  const now = Date.now();

  for (const r of rounds) {
    const items = matchesForRound(matches, r);
    const hasUpcoming = items.some((m) => {
      if (!m.sortDate) return true;
      return new Date(m.sortDate).getTime() >= now - 3 * 60 * 60 * 1000;
    });
    if (hasUpcoming) return r.key;
  }

  return rounds[rounds.length - 1]?.key ?? null;
}

export function groupMatchesByDate(matches: Match[]): { key: string; label: string; items: Match[] }[] {
  const sorted = [...matches].sort((a, b) => (a.sortDate ?? '').localeCompare(b.sortDate ?? ''));
  const order: string[] = [];
  const map = new Map<string, Match[]>();

  for (const m of sorted) {
    const d = m.sortDate ? new Date(m.sortDate) : null;
    const key =
      d && !Number.isNaN(d.getTime())
        ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        : 'unknown';
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(m);
  }

  return order.map((key) => {
    const items = map.get(key)!;
    const sample = items[0]?.sortDate ? new Date(items[0].sortDate) : null;
    const label =
      sample && !Number.isNaN(sample.getTime())
        ? sample.toLocaleDateString('es', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })
        : 'Fecha por confirmar';
    return {
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      items,
    };
  });
}

/** Destaca solo si hay un único máximo (evita marcar 33/33/33 al redondear). */
export function uniqueTopPick(mm: { win1: number; draw: number; win2: number }): '1' | 'X' | '2' | null {
  const r1 = Math.round(mm.win1);
  const rX = Math.round(mm.draw);
  const r2 = Math.round(mm.win2);
  const top = Math.max(r1, rX, r2);
  if (top <= 0) return null;
  const hits: Array<'1' | 'X' | '2'> = [];
  if (r1 === top) hits.push('1');
  if (rX === top) hits.push('X');
  if (r2 === top) hits.push('2');
  return hits.length === 1 ? hits[0] : null;
}
