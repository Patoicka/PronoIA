/**
 * Datos de demostración para "Kronos en números".
 * Solo deben consumirse vía `lib/dashboardStats` y nunca en producción.
 */
import {
  buildDashboardStats,
  type DashboardStats,
  type DashboardStatsPeriod,
} from '../types/dashboardStats';

/** Conteos base por periodo (el % se calcula en buildDashboardStats). */
const MOCK_BY_PERIOD: Record<
  DashboardStatsPeriod,
  { totalPredictions: number; evaluatedPredictions: number; correctPredictions: number }
> = {
  today: {
    totalPredictions: 4,
    evaluatedPredictions: 3,
    correctPredictions: 2,
  },
  '7d': {
    totalPredictions: 15,
    evaluatedPredictions: 12,
    correctPredictions: 10,
  },
  '30d': {
    totalPredictions: 48,
    evaluatedPredictions: 40,
    correctPredictions: 31,
  },
};

export function getMockDashboardStats(period: DashboardStatsPeriod): DashboardStats {
  return buildDashboardStats(MOCK_BY_PERIOD[period]);
}
