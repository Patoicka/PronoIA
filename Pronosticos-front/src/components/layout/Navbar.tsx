import React from 'react';
import { Target, Bell } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `hover:text-white transition ${isActive ? 'text-[#c85000]' : ''}`;

  return (
    <nav 
      className="sticky top-0 z-50 flex items-center justify-between px-5 md:px-8 py-4" 
      style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1a1a' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#c85000,#22783c)' }}>
          <Target style={{ width: '18px', height: '18px', color: '#fff' }} />
        </div>
        <span id="nav-title" className="text-lg font-bold tracking-tight">ProPredict</span>
      </div>
      
      <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: '#888' }}>
        <NavLink to="/" className={navLinkClass}>Dashboard</NavLink>
        <NavLink to="/predictions" className={navLinkClass}>Predicciones</NavLink>
        <NavLink to="/stats" className={navLinkClass}>Estadísticas</NavLink>
        <NavLink to="/leagues" className={navLinkClass}>Ligas</NavLink>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition">
          <Bell style={{ width: '18px', height: '18px', color: '#888' }} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#c85000' }}></span>
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#1a1a1a', border: '2px solid #c85000' }}>
          U
        </div>
      </div>
    </nav>
  );
};
