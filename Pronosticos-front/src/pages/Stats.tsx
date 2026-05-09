import React from 'react';
import { BarChart2, TrendingUp, Calendar } from 'lucide-react';
import { monthlyData } from '../data/mockData';

export const Stats: React.FC = () => {
  return (
    <section className="space-y-6">
      <div className="fade-in">
        <h1 className="text-3xl font-extrabold mb-2 text-white">Estadísticas Detalladas</h1>
        <p style={{ color: '#888' }}>Análisis profundo de tu rendimiento y tendencias</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="fade-in rounded-xl p-6" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
          <h3 className="font-bold mb-6 flex items-center gap-2 text-white">
            <BarChart2 style={{ width: '18px', height: '18px', color: '#c85000' }} /> Resumen de Resultados
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: '#1a1a1a' }}>
              <span style={{ color: '#888' }}>Predicciones Totales</span> 
              <span className="font-bold text-xl">156</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: '#1a1a1a' }}>
              <span style={{ color: '#888' }}>Acertadas</span> 
              <span className="font-bold text-xl" style={{ color: '#22783c' }}>122</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: '#1a1a1a' }}>
              <span style={{ color: '#888' }}>Fallidas</span> 
              <span className="font-bold text-xl" style={{ color: '#c85000' }}>34</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#888' }}>Tasa de Acierto</span> 
              <span className="font-bold text-xl" style={{ color: '#22783c' }}>78.2%</span>
            </div>
          </div>
        </div>

        <div className="fade-in rounded-xl p-6" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
          <h3 className="font-bold mb-6 flex items-center gap-2 text-white">
            <TrendingUp style={{ width: '18px', height: '18px', color: '#22783c' }} /> Rendimiento Financiero
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: '#1a1a1a' }}>
              <span style={{ color: '#888' }}>Ganancia Mensual</span> 
              <span className="font-bold text-xl" style={{ color: '#22783c' }}>+$2,450</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: '#1a1a1a' }}>
              <span style={{ color: '#888' }}>ROI Mensual</span> 
              <span className="font-bold text-xl" style={{ color: '#22783c' }}>+14.5%</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: '#1a1a1a' }}>
              <span style={{ color: '#888' }}>Ticket Promedio</span> 
              <span className="font-bold text-xl">$125</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#888' }}>Mejor Mes</span> 
              <span className="font-bold text-xl" style={{ color: '#c85000' }}>+22.3%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fade-in rounded-xl p-6" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
        <h3 className="font-bold mb-6 flex items-center gap-2 text-white">
          <Calendar style={{ width: '18px', height: '18px', color: '#c85000' }} /> Desempeño por Mes
        </h3>
        <div className="space-y-4">
          {monthlyData.map((m, i) => (
            <div key={i} className="rounded-lg p-4" style={{ background: '#0a0a0a' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold">{m.month}</span>
                <span className="px-3 py-1 rounded-lg text-sm font-bold" style={{ background: 'rgba(34,120,60,0.15)', color: '#22783c' }}>
                  +{m.roi}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p style={{ color: '#888' }}>Predicciones</p>
                  <p className="font-bold text-base">{m.predictions}</p>
                </div>
                <div>
                  <p style={{ color: '#888' }}>Acertadas</p>
                  <p className="font-bold text-base" style={{ color: '#22783c' }}>{m.wins}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
