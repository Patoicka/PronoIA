import React, { useState, useEffect } from 'react';
import { X, Trophy, Activity } from 'lucide-react';
import { teamStats, teamPlayers, getTeamLogo } from '../../data/mockData';
import { TeamCrest } from './TeamCrest';

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
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const stats = teamStats[teamName];
  const players = teamPlayers[teamName] || [];
  const logo = getTeamLogo(teamName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] fade-in"
        style={{ animationDuration: '0.25s' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={teamName}
      >
        <div
          className="p-5 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <TeamCrest src={logo} name={teamName} size={48} rounded="lg" />
            <h3 className="text-title truncate">{teamName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {stats ? (
            <>
              <div
                className="mb-5 p-4"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <h4
                  className="text-meta uppercase tracking-wider font-bold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--text-dim)' }}
                >
                  <Trophy size={14} style={{ color: 'var(--accent)' }} /> Distribución de resultados
                </h4>
                <div
                  className="flex h-2.5 rounded-full overflow-hidden mb-3"
                  style={{ background: 'var(--border)' }}
                >
                  <div style={{ width: `${stats.winPct}%`, background: 'var(--success)' }} title="Victorias" />
                  <div style={{ width: `${stats.drawPct}%`, background: 'var(--text-dim)' }} title="Empates" />
                  <div style={{ width: `${stats.lossPct}%`, background: 'var(--danger)' }} title="Derrotas" />
                </div>
                <div className="flex justify-between text-meta font-semibold flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
                    {stats.winPct}% Victorias
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-dim)' }} />
                    {stats.drawPct}% Empates
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }} />
                    {stats.lossPct}% Derrotas
                  </span>
                </div>
              </div>

              <div className="flex gap-1 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                {(
                  [
                    { id: 'stats' as const, label: 'Estadísticas' },
                    { id: 'players' as const, label: 'Jugadores' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="focus-ring px-3 py-2 text-sm font-semibold transition border-b-2 -mb-px"
                    style={{
                      color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
                      borderColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                      background: activeTab === tab.id ? 'var(--accent-bg)' : 'transparent',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'stats' && (
                <div className="stack-dense" style={{ gap: 'var(--space-4)' }}>
                  <h4
                    className="text-meta uppercase tracking-wider font-bold flex items-center gap-2"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    <Activity size={14} style={{ color: 'var(--success)' }} /> Rendimiento en campo
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <StatCard label="Posesión" value={`${stats.possessionAvg}%`} accent />
                    <StatCard label="Tiros a puerta" value={stats.shotsOnTarget} />
                    <StatCard label="Balones recup." value={stats.tacklesWon} />
                    <StatCard label="Despejes" value={stats.clearances} muted />
                  </div>

                  <h4
                    className="text-meta uppercase tracking-wider font-bold"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Disciplina y balón parado
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <StatCard label="Corners" value={stats.corners} />
                    <StatCard label="Faltas" value={stats.foulsCommitted} accent />
                    <StatCard label="Amarillas" value={stats.yellows} warn />
                    <StatCard label="Rojas" value={stats.reds} danger />
                  </div>
                </div>
              )}

              {activeTab === 'players' && (
                <div className="stack-dense">
                  {players.length > 0 ? (
                    players.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                        style={{
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                            {p.name}
                          </p>
                          <p className="text-meta">PJ: {p.matches}</p>
                        </div>
                        <div className="flex gap-4 text-sm flex-shrink-0">
                          <div className="text-center">
                            <p className="text-meta uppercase" style={{ fontSize: 'var(--text-label-size)' }}>
                              Goles
                            </p>
                            <p className="font-bold text-mono" style={{ color: 'var(--success)' }}>
                              {p.goals}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-meta uppercase" style={{ fontSize: 'var(--text-label-size)' }}>
                              Asist
                            </p>
                            <p className="font-bold text-mono" style={{ color: 'var(--success)' }}>
                              {p.assists}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-meta uppercase" style={{ fontSize: 'var(--text-label-size)' }}>
                              Tar
                            </p>
                            <p className="font-bold text-mono" style={{ color: 'var(--accent)' }}>
                              {p.yellows + p.reds}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p className="text-meta">No hay datos de jugadores para {teamName}.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p className="text-meta">No hay estadísticas disponibles para {teamName}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  accent?: boolean;
  muted?: boolean;
  warn?: boolean;
  danger?: boolean;
}> = ({ label, value, accent, muted, warn, danger }) => {
  const color = danger
    ? 'var(--danger)'
    : warn
      ? 'var(--accent)'
      : accent
        ? 'var(--accent)'
        : muted
          ? 'var(--text-muted)'
          : 'var(--text)';

  return (
    <div
      className="text-center px-3 py-3"
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <p
        className="uppercase font-semibold mb-1"
        style={{ fontSize: 'var(--text-label-size)', color: 'var(--text-dim)' }}
      >
        {label}
      </p>
      <p className="text-xl font-bold text-mono" style={{ color }}>
        {value}
      </p>
    </div>
  );
};
