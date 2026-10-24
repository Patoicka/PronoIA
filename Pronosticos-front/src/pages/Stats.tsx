/**
 * Pantalla de métricas de rendimiento (mock).
 * No está enrutada a propósito: no enlazar hasta tener aciertos reales del modelo.
 * Migrada a tokens Kronos Nightboard para consistencia si se activa más adelante.
 */
import React from 'react';
import { BarChart2, TrendingUp, Calendar } from 'lucide-react';
import { monthlyData } from '../data/mockData';

export const Stats: React.FC = () => {
  return (
    <section className="stack-dense fade-in" style={{ gap: 'var(--space-section)' }}>
      <div>
        <h1 className="text-title mb-0.5">Estadísticas del modelo</h1>
        <p className="text-meta">Resumen de aciertos y tendencias (datos de demostración).</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="panel p-4">
          <h3 className="text-meta uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
            <BarChart2 size={14} style={{ color: 'var(--accent)' }} /> Resumen de resultados
          </h3>
          <div className="stack-dense" style={{ gap: '0.75rem' }}>
            <StatRow label="Predicciones totales" value="156" />
            <StatRow label="Acertadas" value="122" color="var(--success)" />
            <StatRow label="Fallidas" value="34" color="var(--danger)" />
            <StatRow label="Tasa de acierto" value="78.2%" color="var(--success)" last />
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="text-meta uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={14} style={{ color: 'var(--success)' }} /> Señal del modelo
          </h3>
          <div className="stack-dense" style={{ gap: '0.75rem' }}>
            <StatRow label="Confianza media" value="64%" />
            <StatRow label="Picks alta confianza" value="41" color="var(--success)" />
            <StatRow label="Mercados cubiertos" value="1X2 · O/U" />
            <StatRow label="Mejor mes (demo)" value="+22.3%" color="var(--accent)" last />
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <h3 className="text-meta uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
          <Calendar size={14} style={{ color: 'var(--accent)' }} /> Desempeño por mes
        </h3>
        <div className="stack-dense">
          {monthlyData.map((m, i) => (
            <div
              key={i}
              className="px-3 py-3"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {m.month}
                </span>
                <span
                  className="text-mono font-bold px-2 py-0.5 rounded-full"
                  style={{
                    fontSize: 'var(--text-label-size)',
                    background: 'var(--success-bg)',
                    color: 'var(--success)',
                  }}
                >
                  +{m.roi}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-meta">Predicciones</p>
                  <p className="font-bold text-mono text-base" style={{ color: 'var(--text)' }}>
                    {m.predictions}
                  </p>
                </div>
                <div>
                  <p className="text-meta">Acertadas</p>
                  <p className="font-bold text-mono text-base" style={{ color: 'var(--success)' }}>
                    {m.wins}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StatRow: React.FC<{
  label: string;
  value: string;
  color?: string;
  last?: boolean;
}> = ({ label, value, color = 'var(--text)', last }) => (
  <div
    className="flex justify-between items-center pb-3"
    style={last ? undefined : { borderBottom: '1px solid var(--border)' }}
  >
    <span className="text-meta" style={{ color: 'var(--text-muted)' }}>
      {label}
    </span>
    <span className="font-bold text-lg text-mono" style={{ color }}>
      {value}
    </span>
  </div>
);
