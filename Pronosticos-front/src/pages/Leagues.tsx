import React, { useState } from 'react';
import { leaguesList, standings, getTeamLogo } from '../data/mockData';
import { LeagueTabs } from '../components/ui/LeagueTabs';
import { TeamModal } from '../components/ui/TeamModal';

export const Leagues: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState(
    leaguesList.some((l) => l.name === 'Premier League') ? 'Premier League' : leaguesList[0].name,
  );
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const rows = standings[selectedLeague] || [];

  return (
    <section className="stack-dense fade-in">
      <div>
        <h1 className="text-title mb-0.5">Tablas de posiciones</h1>
        <p className="text-meta">Selecciona una liga para ver la clasificación.</p>
      </div>

      <LeagueTabs
        leagues={leaguesList}
        selected={selectedLeague}
        onSelect={setSelectedLeague}
        variant="pill"
      />

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                <th className="py-2.5 px-3 w-10 text-center font-semibold">#</th>
                <th className="py-2.5 px-3 font-semibold">Equipo</th>
                <th className="text-center py-2.5 px-2 font-semibold">PJ</th>
                <th className="text-center py-2.5 px-2 font-semibold hidden sm:table-cell">G</th>
                <th className="text-center py-2.5 px-2 font-semibold hidden sm:table-cell">E</th>
                <th className="text-center py-2.5 px-2 font-semibold hidden sm:table-cell">P</th>
                <th className="text-center py-2.5 px-2 font-semibold hidden md:table-cell">GF</th>
                <th className="text-center py-2.5 px-2 font-semibold hidden md:table-cell">GC</th>
                <th className="text-center py-2.5 px-2 font-semibold">DG</th>
                <th className="text-center py-2.5 px-2 font-bold" style={{ color: 'var(--text)' }}>
                  PTS
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((team) => (
                <tr
                  key={team.team}
                  className="group cursor-pointer transition-colors focus-within:bg-white/[0.03]"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onClick={() => setSelectedTeam(team.team)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTeam(team.team);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver estadísticas de ${team.team}`}
                >
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className="text-xs font-bold text-mono"
                      style={{
                        color:
                          team.pos <= 4
                            ? 'var(--success)'
                            : team.pos >= rows.length - 2
                              ? 'var(--danger)'
                              : 'var(--text-dim)',
                      }}
                    >
                      {team.pos}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getTeamLogo(team.team)}
                        alt=""
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
                  <td className="text-center py-2.5 px-2 text-mono" style={{ color: 'var(--text-muted)' }}>
                    {team.played}
                  </td>
                  <td
                    className="text-center py-2.5 px-2 text-mono hidden sm:table-cell"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {team.wins}
                  </td>
                  <td
                    className="text-center py-2.5 px-2 text-mono hidden sm:table-cell"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {team.draws}
                  </td>
                  <td
                    className="text-center py-2.5 px-2 text-mono hidden sm:table-cell"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {team.losses}
                  </td>
                  <td
                    className="text-center py-2.5 px-2 text-mono hidden md:table-cell"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {team.gf}
                  </td>
                  <td
                    className="text-center py-2.5 px-2 text-mono hidden md:table-cell"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {team.ga}
                  </td>
                  <td
                    className="text-center py-2.5 px-2 text-mono text-sm"
                    style={{
                      color:
                        team.gd > 0
                          ? 'var(--success)'
                          : team.gd < 0
                            ? 'var(--danger)'
                            : 'var(--text-muted)',
                    }}
                  >
                    {team.gd > 0 ? '+' : ''}
                    {team.gd}
                  </td>
                  <td className="text-center py-2.5 px-2 font-bold text-base text-mono" style={{ color: 'var(--text)' }}>
                    {team.pts}
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-0">
                    <div className="empty-state m-3">
                      <p className="text-meta">No hay datos de clasificación para {selectedLeague}.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TeamModal
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        teamName={selectedTeam ?? ''}
      />
    </section>
  );
};
