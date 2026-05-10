import React, { useState, useEffect } from 'react';
import { X, Trophy, Activity } from 'lucide-react';
import { teamStats, teamPlayers, getTeamLogo } from '../../data/mockData';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, teamName }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'players'>('stats');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab('stats');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const stats = teamStats[teamName];
  const players = teamPlayers[teamName] || [];
  const logo = getTeamLogo(teamName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div 
        className="rounded-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]" 
        style={{ background: '#141414', border: '1px solid #1e1e1e' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: '#1a1a1a', background: 'linear-gradient(135deg, rgba(200,80,0,0.05), transparent)' }}>
          <div className="flex items-center gap-4">
            <img src={logo} alt={teamName} className="w-12 h-12 object-contain bg-white/5 rounded-xl p-2 border border-white/10" />
            <h3 className="text-2xl font-bold">{teamName}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition">
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {stats ? (
            <>
              {/* Rendimiento Global W/D/L */}
              <div className="mb-6 p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Trophy size={16} color="#c85000" /> Distribución de Resultados
                </h4>
                <div className="flex h-3 rounded-full overflow-hidden mb-3">
                  <div style={{ width: `${stats.winPct}%`, background: '#22783c' }} title="Victorias"></div>
                  <div style={{ width: `${stats.drawPct}%`, background: '#888' }} title="Empates"></div>
                  <div style={{ width: `${stats.lossPct}%`, background: '#c85000' }} title="Derrotas"></div>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22783c]"></span> {stats.winPct}% Victorias</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#888]"></span> {stats.drawPct}% Empates</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#c85000]"></span> {stats.lossPct}% Derrotas</div>
                </div>
              </div>

              <div className="flex gap-2 mb-4 border-b" style={{ borderColor: '#1a1a1a' }}>
                <button 
                  onClick={() => setActiveTab('stats')} 
                  className="px-4 py-2 text-sm font-medium rounded-t-lg transition border-b-2" 
                  style={{ 
                    color: activeTab === 'stats' ? '#fff' : '#888',
                    borderColor: activeTab === 'stats' ? '#c85000' : 'transparent',
                    background: activeTab === 'stats' ? 'rgba(200,80,0,0.05)' : 'transparent'
                  }}
                >
                  Estadísticas
                </button>
                <button 
                  onClick={() => setActiveTab('players')} 
                  className="px-4 py-2 text-sm font-medium rounded-t-lg transition border-b-2" 
                  style={{ 
                    color: activeTab === 'players' ? '#fff' : '#888',
                    borderColor: activeTab === 'players' ? '#c85000' : 'transparent',
                    background: activeTab === 'players' ? 'rgba(200,80,0,0.05)' : 'transparent'
                  }}
                >
                  Jugadores Destacados
                </button>
              </div>

              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mt-4">
                    <Activity size={16} color="#22783c" /> Rendimiento en Campo
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Posesión" value={`${stats.possessionAvg}%`} color="#c85000" />
                    <StatCard label="Tiros a Puerta" value={stats.shotsOnTarget} color="#22783c" />
                    <StatCard label="Balones Recup." value={stats.tacklesWon} color="#22783c" />
                    <StatCard label="Despejes" value={stats.clearances} color="#888" />
                  </div>
                  
                  <h4 className="text-sm font-bold text-white mt-6 mb-3">Disciplina y Balón Parado</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Corners" value={stats.corners} color="#fff" />
                    <StatCard label="Faltas Cometidas" value={stats.foulsCommitted} color="#c85000" />
                    <StatCard label="T. Amarillas" value={stats.yellows} color="#eab308" />
                    <StatCard label="T. Rojas" value={stats.reds} color="#ef4444" />
                  </div>
                </div>
              )}

              {activeTab === 'players' && (
                <div className="space-y-2 mt-4">
                  {players.length > 0 ? players.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-white">{p.name}</p>
                        <p style={{ color: '#888', fontSize: '0.75rem' }}>PJ: {p.matches}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p style={{ color: '#888', fontSize: '0.7rem' }}>GOLES</p>
                          <p className="font-bold" style={{ color: '#22783c' }}>{p.goals}</p>
                        </div>
                        <div className="text-center">
                          <p style={{ color: '#888', fontSize: '0.7rem' }}>ASIST</p>
                          <p className="font-bold" style={{ color: '#22783c' }}>{p.assists}</p>
                        </div>
                        <div className="text-center">
                          <p style={{ color: '#888', fontSize: '0.7rem' }}>TAR</p>
                          <p className="font-bold" style={{ color: '#c85000' }}>{p.yellows + p.reds}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p style={{ color: '#888' }} className="text-center py-8">No hay datos de jugadores disponibles para {teamName}.</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: '#888' }} className="text-center py-8">No hay estadísticas disponibles para {teamName}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
  <div className="rounded-lg p-4 bg-[#0a0a0a] border border-[#1a1a1a] text-center">
    <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
    <p className="text-2xl font-bold" style={{ color }}>{value}</p>
  </div>
);
