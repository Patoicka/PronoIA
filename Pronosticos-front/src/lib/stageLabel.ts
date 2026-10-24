/** Traduce códigos de fase API a etiquetas legibles. */
const STAGE_LABELS: Record<string, string> = {
  REGULAR_SEASON: 'Temporada regular',
  REGULAR: 'Temporada regular',
  GROUP_STAGE: 'Fase de grupos',
  GROUP: 'Fase de grupos',
  ROUND_OF_16: 'Octavos de final',
  QUARTER_FINALS: 'Cuartos de final',
  QUARTERFINALS: 'Cuartos de final',
  SEMI_FINALS: 'Semifinales',
  SEMIFINALS: 'Semifinales',
  FINAL: 'Final',
  FINALS: 'Final',
  THIRD_PLACE: 'Tercer lugar',
  PLAYOFFS: 'Playoffs',
  QUALIFYING: 'Clasificatorias',
  FRIENDLY: 'Amistoso',
  OTHER: 'Otros partidos',
};

export function humanStageLabel(raw?: string | null, fallback?: string): string {
  if (fallback && fallback !== raw && !/^[A-Z0-9_]+$/.test(fallback)) {
    return fallback;
  }
  if (!raw) return fallback || 'Partidos';
  const key = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if (STAGE_LABELS[key]) return STAGE_LABELS[key];
  // "Regular Season" → Title-ish
  if (/^[A-Z0-9_]+$/.test(raw)) {
    return raw
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return raw;
}
