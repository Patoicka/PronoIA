import React, { useState } from 'react';
import { List, Calendar, BarChart2, ArrowLeft } from 'lucide-react';
import { leaguesList, matches, standings } from '../data/mockData';
import { MatchCard } from '../components/ui/MatchCard';
import { MatchModal } from '../components/ui/MatchModal';
import { TeamModal } from '../components/ui/TeamModal';

export const Predictions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'intro' | 'standings' | 'matches' | 'analysis'>('intro');
  const [selectedLeague, setSelectedLeague] = useState('La Liga');
  
  const [selectedMatch, setSelectedMatch] = useState<{name: string, conf: number} | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Agrupación de partidos por liga para la pestaña "matches"
  const groupedMatches = matches.reduce((acc, match) => {
    const league = match.league || 'Otra';
    if (!acc[league]) acc[league] = [];
    acc[league].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  return (
    <section className="space-y-6">
      {activeTab === 'intro' && (
        <div className="space-y-6">
          <div className="fade-in">
            <h1 className="text-3xl font-extrabold mb-2 text-white">Predicciones</h1>
            <p style={{ color: '#888' }}>Accede a análisis detallados de partidos, tablas de posiciones y pronósticos</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="fade-in stagger-1 rounded-xl p-6 card-hover cursor-pointer" style={{ background: '#141414', border: '1px solid #1e1e1e' }} onClick={() => setActiveTab('standings')}>
              <div className="flex items-center gap-3 mb-4">
                <List style={{ width: '24px', height: '24px', color: '#c85000' }} />
                <h3 className="font-bold text-lg text-white m-0">Tablas de Posiciones</h3>
              </div>
              <p style={{ color: '#888', fontSize: '0.875rem' }}>Consulta las clasificaciones actuales de cada liga</p>
            </div>
            <div className="fade-in stagger-2 rounded-xl p-6 card-hover cursor-pointer" style={{ background: '#141414', border: '1px solid #1e1e1e' }} onClick={() => setActiveTab('matches')}>
              <div className="flex items-center gap-3 mb-4">
                <Calendar style={{ width: '24px', height: '24px', color: '#c85000' }} />
                <h3 className="font-bold text-lg text-white m-0">Partidos</h3>
              </div>
              <p style={{ color: '#888', fontSize: '0.875rem' }}>Explora próximos partidos con predicciones detalladas</p>
            </div>
            <div className="fade-in stagger-3 rounded-xl p-6 card-hover cursor-pointer" style={{ background: '#141414', border: '1px solid #1e1e1e' }} onClick={() => setActiveTab('analysis')}>
              <div className="flex items-center gap-3 mb-4">
                <BarChart2 style={{ width: '24px', height: '24px', color: '#c85000' }} />
                <h3 className="font-bold text-lg text-white m-0">Análisis</h3>
              </div>
              <p style={{ color: '#888', fontSize: '0.875rem' }}>Análisis comparativo y estadísticas detalladas</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'standings' && (
        <div className="space-y-4 fade-in">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setActiveTab('intro')} className="text-sm px-3 py-1 rounded-lg hover:bg-white/5 transition text-white">
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
            </button>
            <h2 className="text-2xl font-bold text-white m-0">Tablas de Posiciones</h2>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#1a1a1a] mb-4">
            {leaguesList.map((l) => (
              <button 
                key={l.id}
                onClick={() => setSelectedLeague(l.name)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                style={{ 
                  background: selectedLeague === l.name ? '#c85000' : '#1a1a1a', 
                  color: selectedLeague === l.name ? '#fff' : '#888' 
                }}
              >
                {l.flag} {l.name}
              </button>
            ))}
          </div>

          <div className="rounded-xl p-6" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead style={{ borderBottom: '2px solid #1a1a1a', color: '#888' }}>
                  <tr>
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-2">Equipo</th>
                    <th className="text-center py-3 px-2">PJ</th>
                    <th className="text-center py-3 px-2">G</th>
                    <th className="text-center py-3 px-2">E</th>
                    <th className="text-center py-3 px-2">P</th>
                    <th className="text-center py-3 px-2">GF</th>
                    <th className="text-center py-3 px-2">GC</th>
                    <th className="text-center py-3 px-2">DG</th>
                    <th className="text-center py-3 px-2 font-bold">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {(standings[selectedLeague] || []).map((team) => (
                    <tr 
                      key={team.team} 
                      className="hover:bg-white/5 transition cursor-pointer border-b border-[#1a1a1a]"
                      onClick={() => setSelectedTeam(team.team)}
                    >
                      <td className="py-3 px-2 font-mono" style={{ color: '#888' }}>{team.pos}</td>
                      <td className="py-3 px-2 font-semibold">{team.team}</td>
                      <td className="text-center py-3 px-2">{team.played}</td>
                      <td className="text-center py-3 px-2">{team.wins}</td>
                      <td className="text-center py-3 px-2">{team.draws}</td>
                      <td className="text-center py-3 px-2">{team.losses}</td>
                      <td className="text-center py-3 px-2">{team.gf}</td>
                      <td className="text-center py-3 px-2">{team.ga}</td>
                      <td className="text-center py-3 px-2" style={{ color: team.gd > 0 ? '#22783c' : team.gd < 0 ? '#c85000' : '#888' }}>
                        {team.gd > 0 ? '+' : ''}{team.gd}
                      </td>
                      <td className="text-center py-3 px-2 font-bold" style={{ color: '#c85000' }}>{team.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4 fade-in">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setActiveTab('intro')} className="text-sm px-3 py-1 rounded-lg hover:bg-white/5 transition text-white">
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
            </button>
            <h2 className="text-2xl font-bold text-white m-0">Partidos</h2>
          </div>
          
          <div className="grid gap-4">
            {Object.entries(groupedMatches).map(([league, lgMatches]) => (
              <div key={league} className="rounded-xl p-6" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
                <h3 className="font-bold text-lg mb-4 text-white m-0">{league}</h3>
                <div className="space-y-3">
                  {lgMatches.map((m, i) => (
                    <MatchCard 
                      key={i} 
                      match={m} 
                      variant="list" 
                      onClick={() => setSelectedMatch({ name: `${m.home} vs ${m.away}`, conf: m.conf })} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-4 fade-in">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setActiveTab('intro')} className="text-sm px-3 py-1 rounded-lg hover:bg-white/5 transition text-white">
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
            </button>
            <h2 className="text-2xl font-bold text-white m-0">Análisis</h2>
          </div>
          <div className="rounded-xl p-6 text-center" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
            <p style={{ color: '#888' }}>Sección de análisis en desarrollo...</p>
          </div>
        </div>
      )}

      <MatchModal 
        isOpen={!!selectedMatch} 
        onClose={() => setSelectedMatch(null)} 
        matchName={selectedMatch?.name || ''} 
        confidence={selectedMatch?.conf || 0} 
      />

      <TeamModal 
        isOpen={!!selectedTeam} 
        onClose={() => setSelectedTeam(null)} 
        teamName={selectedTeam || ''} 
      />
    </section>
  );
};
