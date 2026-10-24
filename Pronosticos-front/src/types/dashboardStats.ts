/** Periodo del selector "Kronos en números". */
export type DashboardStatsPeriod = 'today' | '7d' | '30d';

/**
 * Métricas de rendimiento de predicciones.
 * Misma forma para mock y (futuro) API real.
 */
export interface DashboardStats {
  totalPredictions: number;
  evaluatedPredictions: number;
  pendingPredictions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  /** Calculado: correct / evaluated * 100 (0 si no hay evaluadas). */
  accuracyPercentage: number;
}

/** Construye stats derivadas; el % de acierto nunca se inventa a mano. */
export function buildDashboardStats(input: {
  totalPredictions: number;
  evaluatedPredictions: number;
  correctPredictions: number;
}): DashboardStats {
  const totalPredictions = Math.max(0, input.totalPredictions);
  const evaluatedPredictions = Math.min(
    totalPredictions,
    Math.max(0, input.evaluatedPredictions),
  );
  const correctPredictions = Math.min(
    evaluatedPredictions,
    Math.max(0, input.correctPredictions),
  );
  const pendingPredictions = totalPredictions - evaluatedPredictions;
  const incorrectPredictions = evaluatedPredictions - correctPredictions;
  const accuracyPercentage =
    evaluatedPredictions > 0 ? (correctPredictions / evaluatedPredictions) * 100 : 0;

  return {
    totalPredictions,
    evaluatedPredictions,
    pendingPredictions,
    correctPredictions,
    incorrectPredictions,
    accuracyPercentage,
  };
}
