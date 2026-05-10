import React, { useState } from 'react';
import { leaguesList, standings, getTeamLogo } from '../data/mockData';
import { TeamModal } from '../components/ui/TeamModal';

export const Leagues: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState(leaguesList[0].name);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const currentStandings = standings[selectedLeague] || [];

  return (
    <section className="space-y-6">
      <div className="fade-in">
        <h1 className="text-3xl font-extrabold mb-2 text-white">Tablas de Posiciones</h1>
        <p style={{ color: '#888' }}>Selecciona una liga para ver la clasificación. Toca un equipo para ver sus estadísticas avanzadas.</p>
      </div>

      {/* Navegación de Ligas Superior */}
      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
        {leaguesList.map((l) => (
          <button 
            key={l.id}
            onClick={() => setSelectedLeague(l.name)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap shadow-sm"
            style={{ 
              background: selectedLeague === l.name ? 'linear-gradient(135deg, #22783c, #144d25)' : '#141414', 
              color: selectedLeague === l.name ? '#fff' : '#888',
              border: selectedLeague === l.name ? '1px solid #22783c' : '1px solid #1e1e1e'
            }}
          >
            <span className="text-lg">{l.flag}</span>
            {l.name}
          </button>
        ))}
      </div>

      <div className="fade-in rounded-2xl p-6 overflow-hidden" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead style={{ borderBottom: '2px solid #1a1a1a', color: '#888' }}>
              <tr>
                <th className="py-4 px-3 w-12 text-center">#</th>
                <th className="py-4 px-3">Equipo</th>
                <th className="text-center py-4 px-3">PJ</th>
                <th className="text-center py-4 px-3 hidden sm:table-cell">G</th>
                <th className="text-center py-4 px-3 hidden sm:table-cell">E</th>
                <th className="text-center py-4 px-3 hidden sm:table-cell">P</th>
                <th className="text-center py-4 px-3 hidden md:table-cell">GF</th>
                <th className="text-center py-4 px-3 hidden md:table-cell">GC</th>
                <th className="text-center py-4 px-3">DG</th>
                <th className="text-center py-4 px-3 font-bold text-white">PTS</th>
              </tr>
            </thead>
            <tbody>
              {currentStandings.map((team) => (
                <tr 
                  key={team.team} 
                  className="hover:bg-white/5 transition cursor-pointer border-b border-[#1a1a1a] group"
                  onClick={() => setSelectedTeam(team.team)}
                >
                  <td className="py-3 px-3 text-center font-mono font-bold" style={{ color: team.pos <= 4 ? '#22783c' : team.pos >= currentStandings.length - 2 ? '#c85000' : '#888' }}>
                    {team.pos}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <img src={getTeamLogo(team.team)} alt={team.team} className="w-6 h-6 object-contain" />
                      <span className="font-bold text-white group-hover:text-[#c85000] transition">{team.team}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-3">{team.played}</td>
                  <td className="text-center py-3 px-3 hidden sm:table-cell">{team.wins}</td>
                  <td className="text-center py-3 px-3 hidden sm:table-cell">{team.draws}</td>
                  <td className="text-center py-3 px-3 hidden sm:table-cell">{team.losses}</td>
                  <td className="text-center py-3 px-3 hidden md:table-cell">{team.gf}</td>
                  <td className="text-center py-3 px-3 hidden md:table-cell">{team.ga}</td>
                  <td className="text-center py-3 px-3 font-mono" style={{ color: team.gd > 0 ? '#22783c' : team.gd < 0 ? '#c85000' : '#888' }}>
                    {team.gd > 0 ? '+' : ''}{team.gd}
                  </td>
                  <td className="text-center py-3 px-3 font-bold text-lg" style={{ color: '#fff' }}>{team.pts}</td>
                </tr>
              ))}
              
              {currentStandings.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12" style={{ color: '#888' }}>
                    No hay datos de clasificación para {selectedLeague}.
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
        teamName={selectedTeam || ''} 
      />
    </section>
  );
};
