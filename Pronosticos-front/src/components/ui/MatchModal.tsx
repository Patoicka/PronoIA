import React, { useState, useEffect } from 'react';
import { X, Info, Goal, Crosshair, Flag, AlertTriangle, PlayCircle } from 'lucide-react';
import { getTeamLogo } from '../../data/mockData';
import type { Match } from '../../data/mockData';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
}

export const MatchModal: React.FC<MatchModalProps> = ({ isOpen, onClose, match }) => {
  const [activeTab, setActiveTab] = useState<'generales' | 'detalles' | 'jugadores'>('generales');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab('generales');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !match) return null;

  const homeLogo = getTeamLogo(match.home);
  const awayLogo = getTeamLogo(match.away);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div 
        className="rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" 
        style={{ background: '#141414', border: '1px solid #1e1e1e' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: '#1a1a1a', background: 'linear-gradient(90deg, rgba(200,80,0,0.05), rgba(34,120,60,0.05))' }}>
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <img src={homeLogo} alt={match.home} className="w-8 h-8 object-contain bg-white/10 rounded-full p-1" />
              <span className="font-bold text-lg hidden sm:block">{match.home}</span>
            </div>
            <span className="text-sm font-mono px-3 py-1 rounded-full" style={{ background: '#1a1a1a', color: '#888' }}>VS</span>
            <div className="flex items-center gap-2">
              <img src={awayLogo} alt={match.away} className="w-8 h-8 object-contain bg-white/10 rounded-full p-1" />
              <span className="font-bold text-lg hidden sm:block">{match.away}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition ml-4">
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Resumen IA */}
          <div className="rounded-xl p-4 flex gap-3 items-start" style={{ background: 'rgba(200,80,0,0.05)', border: '1px solid rgba(200,80,0,0.2)' }}>
            <Info style={{ width: '20px', height: '20px', color: '#c85000', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 className="text-sm font-bold mb-1" style={{ color: '#c85000' }}>Análisis de la IA</h4>
              <p className="text-sm leading-relaxed" style={{ color: '#e8e8e8' }}>
                {match.contextSummary}
              </p>
            </div>
          </div>

          {/* Contenedor Principal de Predicciones */}
          <div className="flex flex-col md:flex-row gap-4 mb-2">
            {/* Columna Izquierda: Resultado Exacto y Doble Oportunidad */}
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Ganador del Partido (1X2)</h4>
                <div className="grid grid-cols-3 gap-2 bg-[#0a0a0a] rounded-xl p-1.5 border border-[#1a1a1a]">
                  {['1', 'X', '2'].map((pickType) => {
                    const isSelected = match.pick === pickType;
                    let name = pickType === '1' ? match.home : pickType === '2' ? match.away : 'Empate';
                    
                    let displayOdds = "2.50";
                    if (match.multiMarkets) {
                      if (pickType === '1') displayOdds = (100 / match.multiMarkets.win1).toFixed(2);
                      if (pickType === 'X') displayOdds = (100 / match.multiMarkets.draw).toFixed(2);
                      if (pickType === '2') displayOdds = (100 / match.multiMarkets.win2).toFixed(2);
                    } else {
                      if (pickType === '1') displayOdds = match.odds;
                      if (pickType === 'X') displayOdds = "3.20";
                      if (pickType === '2') displayOdds = "2.80";
                    }
                    
                    return (
                      <div 
                        key={pickType}
                        className={`p-2 rounded-lg text-center transition ${isSelected ? 'glow-orange' : ''}`}
                        style={{ 
                          background: isSelected ? 'rgba(200,80,0,0.15)' : 'transparent',
                          border: isSelected ? '1px solid rgba(200,80,0,0.5)' : '1px solid transparent'
                        }}
                      >
                        <p className="text-[10px] uppercase font-bold mb-0.5 truncate px-1" style={{ color: isSelected ? '#c85000' : '#666' }}>{name}</p>
                        <p className={`font-bold ${isSelected ? 'text-lg text-white' : 'text-base text-[#888]'}`}>
                          {displayOdds}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {match.multiMarkets && (
                <div>
                  <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Doble Oportunidad</h4>
                  <div className="space-y-2">
                    <MarketCard icon={<Flag size={14} />} label={`${match.home} o Empate`} prob={match.multiMarkets.dc1x} />
                    <MarketCard icon={<Flag size={14} />} label={`${match.away} o Empate`} prob={match.multiMarkets.dcx2} />
                  </div>
                </div>
              )}
            </div>

            {/* Columna Derecha: Mercado de Goles */}
            {match.multiMarkets && (
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Goal size={14} /> Mercado de Goles
                </h4>
                <div className="space-y-2 bg-[#0a0a0a] p-3 rounded-xl border border-[#1a1a1a] h-[calc(100%-1.5rem)]">
                  <MarketCard icon={<PlayCircle size={14} />} label="Más de 1.5 Goles" prob={match.multiMarkets.over15} isCompact />
                  <MarketCard icon={<PlayCircle size={14} />} label="Más de 2.5 Goles" prob={match.multiMarkets.over25} isCompact />
                  <MarketCard icon={<AlertTriangle size={14} />} label="Ambos Anotan (BTTS)" prob={match.multiMarkets.btts} isCompact />
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b" style={{ borderColor: '#1a1a1a' }}>
            <button 
              onClick={() => setActiveTab('generales')} 
              className="px-4 py-2 text-sm font-medium transition border-b-2" 
              style={{ 
                color: activeTab === 'generales' ? '#fff' : '#888',
                borderColor: activeTab === 'generales' ? '#c85000' : 'transparent'
              }}
            >
              Métricas Generales
            </button>
            <button 
              onClick={() => setActiveTab('detalles')} 
              className="px-4 py-2 text-sm font-medium transition border-b-2" 
              style={{ 
                color: activeTab === 'detalles' ? '#fff' : '#888',
                borderColor: activeTab === 'detalles' ? '#c85000' : 'transparent'
              }}
            >
              Estadísticas Detalladas
            </button>
            <button 
              onClick={() => setActiveTab('jugadores')} 
              className="px-4 py-2 text-sm font-medium transition border-b-2" 
              style={{ 
                color: activeTab === 'jugadores' ? '#fff' : '#888',
                borderColor: activeTab === 'jugadores' ? '#c85000' : 'transparent'
              }}
            >
              Jugadores
            </button>
          </div>

          {/* Tab Content */}
          <div className="py-2">
            {activeTab === 'generales' && match.homePred && match.awayPred && (
              <div className="space-y-4">
                <ComparisonRow 
                  icon={<Goal size={16} />} 
                  label="Goles Esperados (xG)" 
                  leftVal={match.homePred.expectedGoals} 
                  rightVal={match.awayPred.expectedGoals} 
                  isFloat 
                />
                <ComparisonRow 
                  icon={<PlayCircle size={16} />} 
                  label="Posesión (%)" 
                  leftVal={match.homePred.possession} 
                  rightVal={match.awayPred.possession} 
                  isPercentage
                />
                <ComparisonRow 
                  icon={<Crosshair size={16} />} 
                  label="Tiros a Puerta" 
                  leftVal={match.homePred.shots} 
                  rightVal={match.awayPred.shots} 
                />
              </div>
            )}

            {activeTab === 'detalles' && match.homePred && match.awayPred && (
              <div className="space-y-4">
                <ComparisonRow 
                  icon={<Flag size={16} />} 
                  label="Tiros de Esquina" 
                  leftVal={match.homePred.corners} 
                  rightVal={match.awayPred.corners} 
                />
                <ComparisonRow 
                  icon={<AlertTriangle size={16} />} 
                  label="Tarjetas Proyectadas" 
                  leftVal={match.homePred.cards} 
                  rightVal={match.awayPred.cards} 
                  reverseColors
                />
              </div>
            )}

            {activeTab === 'jugadores' && match.playerPreds && (
              <div className="space-y-3">
                {match.playerPreds.map((pred, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-white">{pred.playerName}</p>
                      <p style={{ color: '#888', fontSize: '0.75rem' }}>{pred.market} ({pred.team})</p>
                    </div>
                    <div className="text-center px-4">
                      <p style={{ color: '#888', fontSize: '0.7rem' }}>CUOTA</p>
                      <p className="font-bold text-[#c85000]">{pred.odds}</p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: '#888', fontSize: '0.7rem' }}>PROB</p>
                      <p className="font-bold" style={{ color: pred.prob >= 60 ? '#c85000' : '#22783c' }}>{pred.prob}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'jugadores' && (!match.playerPreds || match.playerPreds.length === 0) && (
              <p className="text-center text-sm py-8" style={{ color: '#888' }}>
                No hay pronósticos de jugadores para este partido.
              </p>
            )}

            {activeTab !== 'jugadores' && (!match.homePred || !match.awayPred) && (
              <p className="text-center text-sm py-8" style={{ color: '#888' }}>
                Datos detallados no disponibles para este encuentro.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for Cara a Cara rows
const ComparisonRow = ({ 
  icon, 
  label, 
  leftVal, 
  rightVal, 
  isFloat = false, 
  isPercentage = false,
  reverseColors = false
}: any) => {
  const total = leftVal + rightVal;
  const leftPct = total > 0 ? (leftVal / total) * 100 : 50;
  const rightPct = total > 0 ? (rightVal / total) * 100 : 50;

  // Si reverseColors es true (ej. para tarjetas, más tarjetas es peor), invertimos la lógica del color.
  const leftColor = reverseColors 
    ? (leftVal > rightVal ? '#c85000' : '#22783c')
    : (leftVal > rightVal ? '#22783c' : '#c85000');
  
  const rightColor = reverseColors
    ? (rightVal > leftVal ? '#c85000' : '#22783c')
    : (rightVal > leftVal ? '#22783c' : '#c85000');

  const formatVal = (v: number) => isFloat ? v.toFixed(1) : v;

  return (
    <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#1a1a1a]">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-lg" style={{ color: leftVal >= rightVal ? '#fff' : '#888' }}>{formatVal(leftVal)}{isPercentage ? '%' : ''}</span>
        <div className="flex flex-col items-center gap-1">
          <span style={{ color: '#555' }}>{icon}</span>
          <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#888' }}>{label}</span>
        </div>
        <span className="font-bold text-lg" style={{ color: rightVal >= leftVal ? '#fff' : '#888' }}>{formatVal(rightVal)}{isPercentage ? '%' : ''}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-[#1e1e1e] gap-1">
        <div className="h-full rounded-r-full" style={{ width: `${leftPct}%`, background: leftColor, opacity: leftVal >= rightVal ? 1 : 0.6 }}></div>
        <div className="h-full rounded-l-full" style={{ width: `${rightPct}%`, background: rightColor, opacity: rightVal >= leftVal ? 1 : 0.6 }}></div>
      </div>
    </div>
  );
}

// Helper component for Multi-Markets
const MarketCard = ({ label, prob, icon, isCompact = false }: { label: string, prob: number, icon?: React.ReactNode, isCompact?: boolean }) => {
  const isHighProb = prob >= 70;
  
  return (
    <div 
      className={`rounded-lg border flex items-center justify-between transition-all ${isCompact ? 'p-2.5' : 'p-3'}`}
      style={{
        background: isHighProb ? 'rgba(200,80,0,0.08)' : '#141414',
        borderColor: isHighProb ? 'rgba(200,80,0,0.4)' : '#1e1e1e',
      }}
    >
      <div className="flex items-center gap-2.5">
        {icon && <span style={{ color: isHighProb ? '#c85000' : '#666' }}>{icon}</span>}
        <p className="text-sm font-medium" style={{ color: isHighProb ? '#fff' : '#aaa' }}>{label}</p>
      </div>
      <div className="flex items-center gap-3">
        {isHighProb && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#c85000]/20 text-[#c85000]">Top</span>}
        <div className="text-right">
          <span className="font-bold text-base" style={{ color: isHighProb ? '#c85000' : '#fff' }}>{prob.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
