import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, CalendarDays, ArrowRight, Trophy, Cpu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { Match } from '../data/mockData';
import { mapApiMatch } from '../lib/mapApiMatch';
import { MatchCard } from '../components/ui/MatchCard';
import { MatchModal } from '../components/ui/MatchModal';

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '');

export const Dashboard: React.FC = () => {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_ROOT}/api/matches/live?league_id=1&days_ahead=90`, { cache: 'no-store' });
        if (!res.ok) return;
        const raw: any[] = await res.json();
        const mapped = raw.map(m => mapApiMatch(m, 'Mundial 2026', 1)).filter((m): m is Match => m !== null);
        setAllMatches(mapped);
      } catch { /* falla silenciosamente */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Siguiente partido por fecha
  const nextMatch = useMemo(() => {
    return [...allMatches]
      .filter(m => m.sortDate)
      .sort((a, b) => a.sortDate!.localeCompare(b.sortDate!))[0] ?? null;
  }, [allMatches]);

  const nextDateStr = nextMatch?.sortDate
    ? new Date(nextMatch.sortDate).toLocaleDateString('es', { day: 'numeric', month: 'short' })
    : null;

  // Primeros 5 partidos más próximos
  const featured = useMemo(() => {
    return [...allMatches]
      .filter(m => m.sortDate)
      .sort((a, b) => a.sortDate!.localeCompare(b.sortDate!))
      .slice(0, 5);
  }, [allMatches]);

  return (
    <section className="space-y-6">
      {/* Hero */}
      <header className="fade-in rounded-2xl p-6 md:p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--surface) 0%, #1a0e08 60%, var(--surface) 100%)', border: '1px solid var(--border2)' }}>
        <div className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(234,88,12,0.15), transparent 70%)' }} />
        <div className="relative z-10">
          <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
            Kronos · Mundial 2026
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2" style={{ color: 'var(--text)' }}>
            Predicciones con IA
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
            Pronósticos automáticos con XGBoost, Elo Rating y análisis generado por IA.
          </p>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card fade-in stagger-1 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Próximo partido</span>
          </div>
          <p className="text-xl font-black truncate" style={{ color: 'var(--text)' }}>
            {loading ? '…' : (nextDateStr ?? '—')}
          </p>
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-dim)' }}>
            {loading ? '' : nextMatch ? `${nextMatch.home} vs ${nextMatch.away}` : 'Sin partidos próximos'}
          </p>
        </div>

        <div className="card fade-in stagger-2 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Partidos disponibles</span>
          </div>
          <p className="text-xl font-black" style={{ color: 'var(--text)' }}>
            {loading ? '…' : allMatches.length}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Mundial 2026</p>
        </div>

        <div className="card fade-in stagger-3 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ color: 'var(--accent)', fontSize: 16 }}>🌍</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Selecciones</span>
          </div>
          <p className="text-xl font-black" style={{ color: 'var(--text)' }}>48</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>12 grupos · EUA/MEX/CAN</p>
        </div>

        <div className="card fade-in stagger-4 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Modelos IA</span>
          </div>
          <p className="text-xl font-black" style={{ color: 'var(--text)' }}>6</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>1X2 · Over · BTTS · DC</p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Match list */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>
              Próximos partidos · Mundial 2026
            </h2>
            <NavLink
              to="/predictions"
              className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 transition-colors hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              Ver todo <ArrowRight size={12} />
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
            <div className="card p-8 text-center space-y-2">
              <Trophy size={28} className="mx-auto" style={{ color: 'var(--text-dim)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No hay partidos próximos disponibles.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Mercados */}
          <div className="card p-5">
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Mercados cubiertos</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {['1X2', 'Más de 1.5', 'Más de 2.5', 'BTTS', 'DC 1X', 'DC X2'].map(m => (
                <span key={m} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Cómo funciona */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>¿Cómo funciona?</h3>
            {[
              { n: '1', text: 'El modelo analiza Elo, forma reciente y estadísticas históricas.' },
              { n: '2', text: 'XGBoost predice probabilidades para cada mercado disponible.' },
              { n: '3', text: 'La IA genera un análisis narrativo del partido en lenguaje natural.' },
            ].map(s => (
              <div key={s.n} className="flex gap-3">
                <span className="w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--accent)', color: '#000' }}>{s.n}</span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MatchModal isOpen={!!selectedMatch} onClose={() => setSelectedMatch(null)} match={selectedMatch} />
    </section>
  );
};
