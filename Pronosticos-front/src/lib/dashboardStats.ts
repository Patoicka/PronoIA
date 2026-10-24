import { getMockDashboardStats } from '../data/mockDashboardStats';
import type { DashboardStats, DashboardStatsPeriod } from '../types/dashboardStats';

export type { DashboardStats, DashboardStatsPeriod };

/**
 * En producción los mocks nunca se usan.
 * En desarrollo: activos por defecto; desactivar con VITE_USE_MOCK_DASHBOARD_STATS=false.
 */
export function useMockDashboardStats(): boolean {
  if (import.meta.env.PROD) return false;
  return import.meta.env.VITE_USE_MOCK_DASHBOARD_STATS !== 'false';
}

/**
 * Punto único de entrada para las métricas de Inicio.
 * Cuando exista API real, conectar aquí el fetch y devolver DashboardStats.
 */
export function getDashboardStats(period: DashboardStatsPeriod): DashboardStats | null {
  if (useMockDashboardStats()) {
    return getMockDashboardStats(period);
  }

  // Placeholder: sin endpoint de historial aún.
  return null;
}

export function formatAccuracy(pct: number): string {
  if (!Number.isFinite(pct) || pct <= 0) return '—';
  const rounded = Math.round(pct * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}
