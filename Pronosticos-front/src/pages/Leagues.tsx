import React, { useState } from 'react';
import { leaguesList, standings, getTeamLogo } from '../data/mockData';
import { LeagueTabs } from '../components/ui/LeagueTabs';
import { TeamModal } from '../components/ui/TeamModal';

export const Leagues: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState(leaguesList[0].name);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const rows = standings[selectedLeague] || [];

  return (
    <section className="space-y-5">
      <div className="fade-in">
        <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>Tablas de Posiciones</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Selecciona una liga para ver la clasificación.
        </p>
      </div>

      <LeagueTabs leagues={leaguesList} selected={selectedLeague} onSelect={setSelectedLeague} />

      <div className="card p-0 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                <th className="py-3 px-4 w-10 text-center font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Equipo</th>
                <th className="text-center py-3 px-3 font-semibold">PJ</th>
                <th className="text-center py-3 px-3 font-semibold hidden sm:table-cell">G</th>
                <th className="text-center py-3 px-3 font-semibold hidden sm:table-cell">E</th>
                <th className="text-center py-3 px-3 font-semibold hidden sm:table-cell">P</th>
                <th className="text-center py-3 px-3 font-semibold hidden md:table-cell">GF</th>
                <th className="text-center py-3 px-3 font-semibold hidden md:table-cell">GC</th>
                <th className="text-center py-3 px-3 font-semibold">DG</th>
                <th className="text-center py-3 px-3 font-bold" style={{ color: 'var(--text)' }}>PTS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((team) => (
                <tr
                  key={team.team}
                  className="group cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onClick={() => setSelectedTeam(team.team)}
                >
                  <td className="py-3 px-4 text-center">
                    <span
                      className="text-xs font-bold font-mono"
                      style={{
                        color: team.pos <= 4
                          ? 'var(--success)'
                          : team.pos >= rows.length - 2
                          ? 'var(--danger)'
                          : 'var(--text-dim)',
                      }}
                    >
                      {team.pos}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getTeamLogo(team.team)}
                        alt={team.team}
                        className="w-6 h-6 object-contain flex-shrink-0"
                      />
                      <span
                        className="font-semibold transition-colors group-hover:text-[var(--accent)]"
                        style={{ color: 'var(--text)' }}
                      >
                        {team.team}
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-3" style={{ color: 'var(--text-muted)' }}>{team.played}</td>
                  <td className="text-center py-3 px-3 hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{team.wins}</td>
                  <td className="text-center py-3 px-3 hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{team.draws}</td>
                  <td className="text-center py-3 px-3 hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{team.losses}</td>
                  <td className="text-center py-3 px-3 hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>{team.gf}</td>
                  <td className="text-center py-3 px-3 hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>{team.ga}</td>
                  <td className="text-center py-3 px-3 font-mono text-sm"
                    style={{ color: team.gd > 0 ? 'var(--success)' : team.gd < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {team.gd > 0 ? '+' : ''}{team.gd}
                  </td>
                  <td className="text-center py-3 px-3 font-black text-base" style={{ color: 'var(--text)' }}>
                    {team.pts}
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    No hay datos de clasificación para {selectedLeague}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TeamModal isOpen={!!selectedTeam} onClose={() => setSelectedTeam(null)} teamName={selectedTeam ?? ''} />
    </section>
  );
};
