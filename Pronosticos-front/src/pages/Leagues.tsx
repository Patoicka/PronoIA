import React, { useEffect, useState } from 'react';
import { Loader2, Trophy } from 'lucide-react';

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '');
const WC_LEAGUE_ID = 1;

interface StandingRow {
  pos: number;
  team: string;
  crest: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  gc: number;
  gd: number;
  pts: number;
}

interface GroupStanding {
  group: string;
  table: StandingRow[];
}

export const Leagues: React.FC = () => {
  const [groups, setGroups] = useState<GroupStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_ROOT}/api/competitions/${WC_LEAGUE_ID}/standings`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        if (data.error === 'plan_required') {
          setError('plan_required');
        } else {
          setGroups(data.standings ?? []);
        }
      } catch (e: any) {
        setError(e.message ?? 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="space-y-5">
      <div className="fade-in">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={20} style={{ color: 'var(--accent)' }} />
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Mundial 2026</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Tablas de posiciones por grupo en tiempo real.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando posiciones…</p>
        </div>
      )}

      {!loading && error === 'plan_required' && (
        <div className="card p-8 text-center space-y-3">
          <Trophy size={36} className="mx-auto" style={{ color: 'var(--accent)' }} />
          <p className="font-bold" style={{ color: 'var(--text)' }}>Tablas no disponibles aún</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Las posiciones del Mundial 2026 estarán disponibles una vez que inicie la fase de grupos.
          </p>
        </div>
      )}

      {!loading && error && error !== 'plan_required' && (
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No se pudo cargar la clasificación. Intenta más tarde.
          </p>
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <div className="card p-8 text-center space-y-3">
          <Trophy size={36} className="mx-auto" style={{ color: 'var(--accent)' }} />
          <p className="font-bold" style={{ color: 'var(--text)' }}>Posiciones no disponibles aún</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Las tablas se activarán cuando comience la fase de grupos del Mundial 2026.
          </p>
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 fade-in">
          {groups.map((g) => (
            <GroupTable key={g.group} group={g} />
          ))}
        </div>
      )}
    </section>
  );
};

const GroupTable: React.FC<{ group: GroupStanding }> = ({ group }) => (
  <div className="card p-0 overflow-hidden">
    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
        {group.group}
      </p>
    </div>
    <table className="w-full text-sm">
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <th className="py-2 px-3 text-left font-medium w-6">#</th>
          <th className="py-2 px-3 text-left font-medium">Equipo</th>
          <th className="py-2 px-2 text-center font-medium">PJ</th>
          <th className="py-2 px-2 text-center font-medium hidden sm:table-cell">G</th>
          <th className="py-2 px-2 text-center font-medium hidden sm:table-cell">E</th>
          <th className="py-2 px-2 text-center font-medium hidden sm:table-cell">P</th>
          <th className="py-2 px-2 text-center font-medium">DG</th>
          <th className="py-2 px-3 text-center font-bold" style={{ color: 'var(--text)' }}>Pts</th>
        </tr>
      </thead>
      <tbody>
        {group.table.map((row) => {
          const qualified = row.pos <= 2;
          return (
            <tr key={row.team} style={{ borderBottom: '1px solid var(--border)' }}>
              <td className="py-2.5 px-3">
                <span className="text-xs font-bold font-mono"
                  style={{ color: qualified ? 'var(--success)' : 'var(--text-dim)' }}>
                  {row.pos}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  {row.crest ? (
                    <img src={row.crest} alt={row.team} className="w-5 h-5 object-contain flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <span className="w-5 h-5 text-xs flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ background: 'var(--border2)', color: 'var(--text-dim)' }}>
                      {row.team[0]}
                    </span>
                  )}
                  <span className="font-semibold text-xs truncate" style={{ color: 'var(--text)' }}>
                    {row.team}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{row.played}</td>
              <td className="py-2.5 px-2 text-center text-xs hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{row.wins}</td>
              <td className="py-2.5 px-2 text-center text-xs hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{row.draws}</td>
              <td className="py-2.5 px-2 text-center text-xs hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{row.losses}</td>
              <td className="py-2.5 px-2 text-center text-xs font-mono"
                style={{ color: row.gd > 0 ? 'var(--success)' : row.gd < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                {row.gd > 0 ? '+' : ''}{row.gd}
              </td>
              <td className="py-2.5 px-3 text-center font-black text-sm" style={{ color: 'var(--text)' }}>{row.pts}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
