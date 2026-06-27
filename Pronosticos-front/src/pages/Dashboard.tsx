import React, { useState, useEffect } from 'react';
import { Loader2, CalendarDays, Layers, Database, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { Match } from '../data/mockData';
import { mapApiMatch } from '../lib/mapApiMatch';
import { MatchCard } from '../components/ui/MatchCard';
import { MatchModal } from '../components/ui/MatchModal';

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '');

// Muestra la primera jornada disponible
function firstJornadaMatches(matches: Match[]): Match[] {
  const min = Math.min(...matches.filter(m => m.matchday != null).map(m => m.matchday!));
  return matches.filter(m => m.matchday === min);
}

function nextMatchDate(matches: Match[]): string | null {
  const sorted = [...matches].filter(m => m.sortDate).sort((a, b) => (a.sortDate!).localeCompare(b.sortDate!));
  const next = sorted[0];
  if (!next?.sortDate) return null;
  return new Date(next.sortDate).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const Dashboard: React.FC = () => {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_ROOT}/api/matches/live?league_id=39&days_ahead=90`, { cache: 'no-store' });
        if (!res.ok) return;
        const raw: any[] = await res.json();
        const mapped = raw.map(m => mapApiMatch(m, 'Premier League')).filter((m): m is Match => m !== null);
        setAllMatches(mapped);
        setNextDate(nextMatchDate(mapped));
      } catch { /* falla silenciosamente en el dashboard */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const featured = firstJornadaMatches(allMatches).slice(0, 5);

  return (
    <section className="space-y-6">
      {/* Hero */}
      <header className="fade-in rounded-2xl p-6 md:p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--surface) 0%, #1a0e08 60%, var(--surface) 100%)', border: '1px solid var(--border2)' }}>
        <div className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(234,88,12,0.15), transparent 70%)' }} />
        <div className="relative z-10">
          <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
            Kronos · Pronósticos en tiempo real
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2" style={{ color: 'var(--text)' }}>
            Predicciones con IA
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
            Pronósticos automáticos de fútbol con XGBoost, Elo Rating y análisis de forma.
          </p>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: <CalendarDays size={16} style={{ color: 'var(--accent)' }} />,
            label: 'Próximo partido',
            value: loading ? '…' : (nextDate ?? 'Off-season'),
            sub: 'Premier League',
            delay: 'stagger-1',
          },
          {
            icon: <Layers size={16} style={{ color: 'var(--accent)' }} />,
            label: 'Partidos cargados',
            value: loading ? '…' : allMatches.length,
            sub: 'PL temporada 26/27',
            delay: 'stagger-2',
          },
          {
            icon: <Database size={16} style={{ color: 'var(--accent)' }} />,
            label: 'Equipos con Elo',
            value: '176',
            sub: 'Historial 25.000 partidos',
            delay: 'stagger-3',
          },
          {
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            ),
            label: 'Modelos activos',
            value: '6',
            sub: '1X2 · Over · BTTS · DC',
            delay: 'stagger-4',
          },
        ].map((c, i) => (
          <div key={i} className={`card fade-in ${c.delay} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              {c.icon}
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{c.label}</span>
            </div>
            <p className="text-xl font-black truncate" style={{ color: 'var(--text)' }}>{c.value}</p>
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-dim)' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Match list */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-base truncate" style={{ color: 'var(--text)' }}>
              {featured[0]?.matchday ? `Jornada ${featured[0].matchday}` : 'Próximos'} · Premier League
            </h2>
            <NavLink
              to="/predictions"
              className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 transition-colors hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              <span className="hidden sm:inline">Ver todas las ligas</span>
              <span className="sm:hidden">Ver todo</span>
              <ArrowRight size={12} />
            </NavLink>
          </div>

          {loading ? (
            <div className="card p-12 flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando predicciones…</p>
            </div>
          ) : featured.length > 0 ? (
            <div className="space-y-2">
              {featured.map((m, i) => (
                <MatchCard key={i} match={m} index={i} onClick={() => setSelectedMatch(m)} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p style={{ color: 'var(--text-muted)' }}>No hay partidos próximos disponibles.</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                El backend está en: {API_ROOT}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Ligas disponibles */}
          <div className="card p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)' }}>⚽</span> Ligas disponibles
            </h3>
            <div className="space-y-2">
              {[
                { flag: '🏆', name: 'Mundial 2026', id: 1 },
                { flag: '🏴', name: 'Premier League', id: 39 },
                { flag: '🇪🇸', name: 'La Liga', id: 140 },
                { flag: '🇮🇹', name: 'Serie A', id: 135 },
                { flag: '🇩🇪', name: 'Bundesliga', id: 78 },
                { flag: '🇫🇷', name: 'Ligue 1', id: 61 },
              ].map(l => (
                <NavLink
                  key={l.id}
                  to="/predictions"
                  className="flex items-center justify-between text-sm px-3 py-2 rounded-xl transition-colors hover:bg-white/5"
                >
                  <span>{l.flag} {l.name}</span>
                  <ArrowRight size={12} style={{ color: 'var(--text-dim)' }} />
                </NavLink>
              ))}
            </div>
          </div>

          {/* Mercados cubiertos */}
          <div className="card p-5">
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Mercados cubiertos</h3>
            <div className="flex flex-wrap gap-2">
              {['1X2', 'Más de 1.5', 'Más de 2.5', 'BTTS', 'DC 1X', 'DC X2'].map(m => (
                <span key={m} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <MatchModal isOpen={!!selectedMatch} onClose={() => setSelectedMatch(null)} match={selectedMatch} />
    </section>
  );
};
