import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LoginModal } from '../ui/LoginModal';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/predictions', label: 'Predicciones', end: false },
  { to: '/leagues', label: 'Ligas', end: false },
];

export const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold transition-colors ${isActive ? 'text-[#ea580c]' : 'text-[#888] hover:text-[#f5f5f5]'}`;

  return (
    <>
      <nav
        className="sticky top-0 z-40 px-5 md:px-8"
        style={{ background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-base font-black tracking-tight" style={{ color: 'var(--text)' }}>
              Kronos
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLoginOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Iniciar sesión
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menú"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1" onClick={() => setMenuOpen(false)}>
            {NAV_LINKS.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive
                    ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                    : 'text-[#888] hover:text-[#f5f5f5] hover:bg-white/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button
              onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-[#888] hover:text-[#f5f5f5] hover:bg-white/5"
            >
              Iniciar sesión
            </button>
          </div>
        )}
      </nav>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};
