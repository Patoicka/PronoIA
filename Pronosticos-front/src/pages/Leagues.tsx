import React from 'react';
import { leagues } from '../data/mockData';

export const Leagues: React.FC = () => {
  return (
    <section className="space-y-6">
      <div className="fade-in">
        <h1 className="text-3xl font-extrabold mb-2 text-white">Análisis por Liga</h1>
        <p style={{ color: '#888' }}>Desempeño y estadísticas de cada competición</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {leagues.map((l, i) => (
          <div 
            key={i} 
            className="fade-in rounded-xl p-6 card-hover" 
            style={{ background: '#141414', border: '1px solid #1e1e1e', animationDelay: `${0.1 * i}s` }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold mb-1 text-white">{l.flag} {l.name}</h3>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>{l.total} predicciones</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold" style={{ color: '#c85000' }}>{l.acc}%</p>
                <p style={{ color: '#888', fontSize: '0.75rem' }}>Tasa Acierto</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t" style={{ borderColor: '#1a1a1a' }}>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: '#888' }}>Predicciones en Vivo</span>
                <span className="font-bold">{l.count}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: '#888' }}>Últimos 7 días</span>
                <span className="font-bold" style={{ color: '#22783c' }}>+18%</span>
              </div>
              <button 
                className="w-full mt-3 py-2 rounded-lg text-sm font-medium transition" 
                style={{ background: '#1a1a1a', color: '#e8e8e8' }}
              >
                Ver detalles
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
