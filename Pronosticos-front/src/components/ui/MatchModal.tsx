import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Prediction {
  type: string;
  name: string;
  odds: string;
  prob: number;
}

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchName: string;
  confidence: number;
}

export const MatchModal: React.FC<MatchModalProps> = ({ isOpen, onClose, matchName, confidence }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const predictions: Prediction[] = [
    { type: '1', name: 'Victoria Local', odds: '1.85', prob: confidence + 5 },
    { type: 'X', name: 'Empate', odds: '3.40', prob: Math.max(confidence - 10, 15) },
    { type: '2', name: 'Victoria Visitante', odds: '2.90', prob: 100 - (confidence + 5) },
  ].sort((a, b) => b.prob - a.prob);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div 
        className="rounded-2xl max-w-2xl w-full overflow-hidden" 
        style={{ background: '#141414', border: '1px solid #1e1e1e' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: '#1a1a1a' }}>
          <h3 className="text-xl font-bold">{matchName}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition">
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto space-y-3">
          {predictions.map(p => (
            <div key={p.type} className="flex items-center justify-between p-4 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
              <div className="flex-1">
                <p className="font-semibold">{p.name}</p>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>Predicción: {p.type}</p>
              </div>
              <div className="text-center">
                <p style={{ color: '#888', fontSize: '0.75rem' }}>Cuota</p>
                <p className="font-bold" style={{ color: '#c85000' }}>{p.odds}</p>
              </div>
              <div className="text-right">
                <p style={{ color: '#888', fontSize: '0.75rem' }}>Probabilidad</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-16 h-1.5 rounded-full" style={{ background: '#1a1a1a' }}>
                    <div className="h-full rounded-full" style={{ width: `${p.prob}%`, background: 'linear-gradient(90deg,#22783c,#c85000)' }}></div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: p.prob >= 60 ? '#c85000' : '#22783c' }}>{p.prob}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
