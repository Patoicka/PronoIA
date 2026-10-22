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
    `nav-link ${isActive ? 'nav-link-active' : ''}`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link-mobile ${isActive ? 'nav-link-mobile-active' : ''}`;

  const initials = user
    ? `${user.nombres[0] ?? ''}${user.apellidos[0] ?? ''}`.toUpperCase()
    : '';

  const handleLogout = () => { setDropOpen(false); logout(); navigate('/'); };

  return (
    <>
      <nav className="nav-shell">
        <div className="nav-inner">

          {/* Logo — marca Kronos (peso display, no font-black genérico) */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Kronos" className="w-9 h-9 object-contain" />
            </div>
            <span className="text-brand text-base">
              Kronos
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] transition-colors hover:bg-white/[0.04]"
                >
                  <div
                    className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-xs font-bold flex-shrink-0 text-mono"
                    style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                  >
                    {initials}
                  </div>
                  <span className="text-sm font-semibold max-w-[100px] truncate" style={{ color: 'var(--text)' }}>
                    {user.nombres}
                  </span>
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }}
                    className={`transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 overflow-hidden shadow-xl"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border2)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-meta truncate" style={{ color: 'var(--text)', fontWeight: 700 }}>
                        {user.nombres} {user.apellidos}
                      </p>
                      <p className="text-meta truncate">{user.correo}</p>
                    </div>
                    <button onClick={() => { setDropOpen(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/[0.04]"
                      style={{ color: 'var(--text-muted)' }}>
                      <User size={14} /> Mi perfil
                    </button>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/[0.04]"
                      style={{ color: 'var(--danger)' }}>
                      <LogOut size={14} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setLoginOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-semibold transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                Iniciar sesión
              </button>
            )}

            <button className="md:hidden p-2 rounded-[var(--radius-sm)] transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMenuOpen(v => !v)} aria-label="Menú">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-3 pt-1 space-y-0.5" onClick={() => setMenuOpen(false)}>
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} className={mobileLinkClass}>
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                  className="nav-link-mobile w-full text-left">
                  Mi perfil
                </button>
                <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="nav-link-mobile w-full text-left"
                  style={{ color: 'var(--danger)' }}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                className="nav-link-mobile w-full text-left">
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
