import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Match } from '../../data/mockData';

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  index?: number;
  variant?: 'dashboard' | 'list';
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onClick, index = 0, variant = 'dashboard' }) => {
  const isHighConf = match.conf >= 80;

  if (variant === 'list') {
    return (
      <div 
        className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition hover:bg-white/5" 
        style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }} 
        onClick={onClick}
      >
        <div className="flex-1">
          <p className="font-semibold">{match.home} <span style={{ color: '#888' }}>vs</span> {match.away}</p>
          <p style={{ color: '#888', fontSize: '0.875rem' }}>
            {match.live ? (
              <span className="flex items-center gap-1 text-xs font-mono" style={{ color: '#22783c' }}>
                <span className="pulse-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#22783c' }}></span>
                EN VIVO
              </span>
            ) : (
              `Hoy a las ${match.time}`
            )}
          </p>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg" style={{ color: isHighConf ? '#c85000' : '#22783c' }}>
            {match.conf}%
          </div>
          <p style={{ color: '#888', fontSize: '0.75rem' }}>Confianza</p>
        </div>
        <ChevronRight style={{ width: '18px', height: '18px', color: '#555', marginLeft: '1rem' }} />
      </div>
    );
  }

  // Dashboard variant
  return (
    <div 
      className="fade-in rounded-xl p-4 card-hover" 
      style={{ background: '#141414', border: '1px solid #1e1e1e', animationDelay: `${0.15 * index}s` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono" style={{ color: '#888' }}>{match.league}</span>
        <div className="flex items-center gap-2">
          {match.live ? (
            <span className="flex items-center gap-1 text-xs font-mono" style={{ color: '#22783c' }}>
              <span className="pulse-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#22783c' }}></span>
              LIVE
            </span>
          ) : (
            <span className="text-xs font-mono" style={{ color: '#555' }}>{match.time}</span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-semibold text-sm">{match.home}</p>
          <p className="font-semibold text-sm" style={{ color: '#888' }}>vs {match.away}</p>
        </div>
        <div className="text-center px-4">
          <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold" style={{ background: isHighConf ? 'rgba(200,80,0,0.15)' : 'rgba(136,136,136,0.1)', color: isHighConf ? '#c85000' : '#888' }}>
            {match.pick}
          </span>
          <p className="text-xs mt-1 font-mono" style={{ color: '#555' }}>{match.odds}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
              <div className="h-full rounded-full bar-fill" style={{ width: `${match.conf}%`, background: isHighConf ? '#c85000' : '#22783c' }}></div>
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: isHighConf ? '#c85000' : '#22783c' }}>{match.conf}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
