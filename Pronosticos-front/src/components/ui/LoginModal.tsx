import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; setIsRegister(false); }
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="card fade-in max-w-sm w-full overflow-hidden"
        style={{ animationDuration: '0.25s' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 text-center relative" style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-white/5 transition"
            style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
          <div className="mx-auto w-11 h-11 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'var(--accent)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 8l3 4-3 4-3-4z" fill="white" stroke="none" />
            </svg>
          </div>
          <h3 className="text-lg font-black mb-1" style={{ color: 'var(--text)' }}>
            {isRegister ? 'Crear cuenta' : 'Bienvenido'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Únete a Kronos' : 'Inicia sesión para continuar'}
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {isRegister && (
            <Field icon={<User size={15} />} type="text" placeholder="Tu nombre" label="Nombre" />
          )}
          <Field icon={<Mail size={15} />} type="email" placeholder="tu@correo.com" label="Correo" />
          <Field icon={<Lock size={15} />} type="password" placeholder="••••••••" label="Contraseña" />

          {!isRegister && (
            <div className="text-right">
              <button className="text-xs font-semibold transition hover:opacity-70" style={{ color: 'var(--accent)' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button className="w-full font-bold py-2.5 rounded-xl text-white text-sm transition hover:opacity-90"
            style={{ background: 'var(--accent)' }}>
            {isRegister ? 'Registrarse' : 'Iniciar sesión'}
          </button>
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <button onClick={() => setIsRegister(v => !v)}
              className="font-bold hover:underline transition"
              style={{ color: 'var(--accent)' }}>
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ icon: React.ReactNode; type: string; placeholder: string; label: string }> = ({ icon, type, placeholder, label }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none transition-colors"
        style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  </div>
);
