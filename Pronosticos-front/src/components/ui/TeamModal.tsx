import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { teamStats, teamPlayers } from '../../data/mockData';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div 
        className="rounded-2xl max-w-3xl w-full overflow-hidden" 
        style={{ background: '#141414', border: '1px solid #1e1e1e' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: '#1a1a1a' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold" style={{ background: 'rgba(200,80,0,0.2)', color: '#c85000' }}>
              ⚽
            </div>
            <h3 className="text-xl font-bold">{teamName}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition">
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto">
          {stats ? (
            <>
              <div className="flex gap-2 mb-4 border-b" style={{ borderColor: '#1a1a1a' }}>
                <button 
                  onClick={() => setActiveTab('stats')} 
                  className="px-4 py-2 text-sm font-medium rounded-t-lg transition" 
                  style={{ background: activeTab === 'stats' ? '#c85000' : '#1a1a1a', color: activeTab === 'stats' ? '#fff' : '#888', border: 'none' }}
                >
                  Estadísticas
                </button>
                <button 
                  onClick={() => setActiveTab('players')} 
                  className="px-4 py-2 text-sm font-medium rounded-t-lg transition" 
                  style={{ background: activeTab === 'players' ? '#c85000' : '#1a1a1a', color: activeTab === 'players' ? '#fff' : '#888', border: 'none' }}
                >
                  Jugadores
                </button>
              </div>

              {activeTab === 'stats' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg p-3" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                    <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tarjetas Amarillas</p>
                    <p className="text-2xl font-bold" style={{ color: '#c85000' }}>{stats.yellows}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                    <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tarjetas Rojas</p>
                    <p className="text-2xl font-bold" style={{ color: '#c85000' }}>{stats.reds}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                    <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Saques de Esquina</p>
                    <p className="text-2xl font-bold" style={{ color: '#22783c' }}>{stats.corners}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                    <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Balones Ganados</p>
                    <p className="text-2xl font-bold" style={{ color: '#22783c' }}>{stats.tacklesWon}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                    <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tiros al Arco</p>
                    <p className="text-2xl font-bold" style={{ color: '#22783c' }}>{stats.shotsOnTarget}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                    <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Posesión</p>
                    <p className="text-2xl font-bold" style={{ color: '#c85000' }}>{stats.possessionAvg}%</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                    <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Faltas</p>
                    <p className="text-2xl font-bold" style={{ color: '#c85000' }}>{stats.foulsCommitted}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                    <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Despejes</p>
                    <p className="text-2xl font-bold" style={{ color: '#22783c' }}>{stats.clearances}</p>
                  </div>
                </div>
              )}

              {activeTab === 'players' && (
                <div className="space-y-2">
                  {players.length > 0 ? players.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{p.name}</p>
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
                    <p style={{ color: '#888' }} className="text-center py-4">No hay datos de jugadores disponibles.</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: '#888' }} className="text-center">No hay estadísticas disponibles para {teamName}</p>
          )}
        </div>
      </div>
    </div>
  );
};
