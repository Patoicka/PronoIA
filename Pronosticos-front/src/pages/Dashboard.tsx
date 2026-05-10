import React from 'react';
import { Trophy, BarChart3, Zap, Flame, Globe, TrendingUp } from 'lucide-react';
import { matches, leagues, perf } from '../data/mockData';
import type { Match } from '../data/mockData';
import { MatchCard } from '../components/ui/MatchCard';
import { MatchModal } from '../components/ui/MatchModal';

export const Dashboard: React.FC = () => {
  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  return (
    <section className="space-y-6">
      <header 
        className="fade-in rounded-2xl p-6 md:p-8 relative overflow-hidden" 
        style={{ background: 'linear-gradient(135deg,#141414 0%,#1a1208 50%,#0f1a12 100%)', border: '1px solid #222' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle,rgba(200,80,0,0.08),transparent 70%)' }}></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="pulse-dot w-2 h-2 rounded-full inline-block" style={{ background: '#22783c' }}></span>
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#22783c' }}>En vivo — 4 partidos</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">Predicciones Deportivas</h1>
          <p className="text-sm md:text-base" style={{ color: '#888' }}>Análisis experto con IA para tus apuestas deportivas de fútbol</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="fade-in stagger-1 rounded-xl p-4 glow-orange card-hover" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy style={{ width: '16px', height: '16px', color: '#c85000' }} />
            <span className="text-xs" style={{ color: '#888' }}>Aciertos</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#c85000' }}>78%</p>
          <p className="text-xs mt-1" style={{ color: '#555' }}>+3.2% esta semana</p>
        </div>
        <div className="fade-in stagger-2 rounded-xl p-4 glow-green card-hover" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 style={{ width: '16px', height: '16px', color: '#22783c' }} />
            <span className="text-xs" style={{ color: '#888' }}>ROI Mensual</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#22783c' }}>+14.5%</p>
          <p className="text-xs mt-1" style={{ color: '#555' }}>Últimos 30 días</p>
        </div>
        <div className="fade-in stagger-3 rounded-xl p-4 card-hover" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap style={{ width: '16px', height: '16px', color: '#c85000' }} />
            <span className="text-xs" style={{ color: '#888' }}>Predicciones Hoy</span>
          </div>
          <p className="text-2xl font-bold">12</p>
          <p className="text-xs mt-1" style={{ color: '#555' }}>8 completadas</p>
        </div>
        <div className="fade-in stagger-4 rounded-xl p-4 card-hover" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
          <div className="flex items-center gap-2 mb-2">
            <Flame style={{ width: '16px', height: '16px', color: '#c85000' }} />
            <span className="text-xs" style={{ color: '#888' }}>Racha Actual</span>
          </div>
          <p className="text-2xl font-bold">5 <span className="text-sm font-normal" style={{ color: '#22783c' }}>W</span></p>
          <p className="text-xs mt-1" style={{ color: '#555' }}>Mejor: 11</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-white m-0">Próximas Predicciones</h2>
            <div className="flex gap-1 text-xs">
              <button className="px-3 py-1 rounded-full font-medium" style={{ background: '#c85000', color: '#fff' }}>Todas</button>
              <button className="px-3 py-1 rounded-full" style={{ background: '#1a1a1a', color: '#888' }}>Alta Conf.</button>
            </div>
          </div>
          <div className="space-y-3">
            {matches.slice(0, 4).map((m, i) => (
              <MatchCard key={i} match={m} index={i} variant="dashboard" onClick={() => setSelectedMatch(m)} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="fade-in stagger-4 rounded-xl p-5" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-white">
              <Globe style={{ width: '14px', height: '14px', color: '#c85000' }} /> Ligas Populares
            </h3>
            <div className="space-y-3">
              {leagues.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-sm cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 -mx-2 transition">
                  <span>{l.flag} {l.name}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#888' }}>{l.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fade-in stagger-5 rounded-xl p-5" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-white">
              <TrendingUp style={{ width: '14px', height: '14px', color: '#22783c' }} /> Rendimiento por Liga
            </h3>
            <div className="space-y-3">
              {perf.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#888' }}>{p.name}</span>
                    <span className="font-mono font-bold" style={{ color: p.pct >= 75 ? '#c85000' : '#e8e8e8' }}>{p.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: '#1e1e1e' }}>
                    <div className="h-full rounded-full bar-fill" style={{ width: `${p.pct}%`, background: 'linear-gradient(90deg,#22783c,#c85000)' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <MatchModal 
        isOpen={!!selectedMatch} 
        onClose={() => setSelectedMatch(null)} 
        match={selectedMatch}
      />
    </section>
  );
};
