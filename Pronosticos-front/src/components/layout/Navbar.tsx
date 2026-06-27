import React, { useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import { LoginModal } from '../ui/LoginModal';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/predictions', label: 'Predicciones', end: false },
  { to: '/leagues', label: 'Ligas', end: false },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold transition-colors ${isActive ? 'text-[var(--accent)]' : 'text-[#888] hover:text-[#f5f5f5]'}`;

  const initials = user
    ? `${user.nombres[0] ?? ''}${user.apellidos[0] ?? ''}`.toUpperCase()
    : '';

  const handleLogout = () => { setDropOpen(false); logout(); navigate('/'); };

  return (
    <>
      <nav className="sticky top-0 z-40 px-5 md:px-8"
        style={{ background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
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
            {user ? (
              /* Usuario logueado */
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors hover:bg-white/5"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: 'var(--accent)', color: '#000' }}>
                    {initials}
                  </div>
                  <span className="text-sm font-semibold max-w-[100px] truncate" style={{ color: 'var(--text)' }}>
                    {user.nombres}
                  </span>
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }}
                    className={`transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden shadow-xl"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border2)' }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                        {user.nombres} {user.apellidos}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.correo}</p>
                    </div>
                    <button onClick={() => { setDropOpen(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                      style={{ color: 'var(--text-muted)' }}>
                      <User size={14} /> Mi perfil
                    </button>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                      style={{ color: 'var(--danger)' }}>
                      <LogOut size={14} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* No logueado */
              <button onClick={() => setLoginOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                Iniciar sesión
              </button>
            )}

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMenuOpen(v => !v)} aria-label="Menú">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1" onClick={() => setMenuOpen(false)}>
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive
                    ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                    : 'text-[#888] hover:text-[#f5f5f5] hover:bg-white/5'}`}>
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-[#888] hover:text-[#f5f5f5] hover:bg-white/5">
                  Mi perfil
                </button>
                <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-white/5"
                  style={{ color: 'var(--danger)' }}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-[#888] hover:text-[#f5f5f5] hover:bg-white/5">
                Iniciar sesión
              </button>
            )}
          </div>
        )}
      </nav>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};
