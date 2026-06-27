import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, Phone, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '');

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [form, setForm] = useState({
    nombres: '', apellidos: '', fecha_nacimiento: '',
    correo: '', telefono: '', password: '', password2: '',
  });

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; setIsRegister(false); setError(null); }
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && form.password !== form.password2) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { nombres: form.nombres, apellidos: form.apellidos,
            fecha_nacimiento: form.fecha_nacimiento || undefined,
            correo: form.correo, telefono: form.telefono || undefined,
            password: form.password }
        : { correo: form.correo, password: form.password };

      const res = await fetch(`${API_ROOT}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Error desconocido');
        return;
      }

      login(data.access_token, data.user);
      onClose();
    } catch {
      setError('No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="card fade-in max-w-sm w-full overflow-hidden"
        style={{ animationDuration: '0.25s', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 text-center relative" style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-white/5 transition"
            style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
          <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 overflow-hidden"
            style={{ background: 'var(--surface2)' }}>
            <img src="/logo.png" alt="Kronos" className="w-12 h-12 object-contain" />
          </div>
          <h3 className="text-lg font-black mb-1" style={{ color: 'var(--text)' }}>
            {isRegister ? 'Crear cuenta' : 'Bienvenido'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Únete a Kronos' : 'Inicia sesión para continuar'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={<User size={15} />} type="text" placeholder="Nombres"
                  label="Nombres" value={form.nombres} onChange={set('nombres')} required />
                <Field icon={<User size={15} />} type="text" placeholder="Apellidos"
                  label="Apellidos" value={form.apellidos} onChange={set('apellidos')} required />
              </div>
              <Field icon={<Calendar size={15} />} type="date" placeholder=""
                label="Fecha de nacimiento" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
              <Field icon={<Phone size={15} />} type="tel" placeholder="+52 55 0000 0000"
                label="Teléfono" value={form.telefono} onChange={set('telefono')} />
            </>
          )}

          <Field icon={<Mail size={15} />} type="email" placeholder="tu@correo.com"
            label="Correo" value={form.correo} onChange={set('correo')} required />
          <Field icon={<Lock size={15} />} type="password" placeholder="••••••••"
            label="Contraseña" value={form.password} onChange={set('password')} required />

          {isRegister && (
            <Field icon={<Lock size={15} />} type="password" placeholder="••••••••"
              label="Confirmar contraseña" value={form.password2} onChange={set('password2')} required />
          )}

          {!isRegister && (
            <div className="text-right">
              <button type="button" className="text-xs font-semibold transition hover:opacity-70"
                style={{ color: 'var(--accent)' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-center px-2 py-2 rounded-lg"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full font-bold py-2.5 rounded-xl text-white text-sm transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            {loading ? 'Cargando…' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="px-6 pb-5 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <button type="button" onClick={() => { setIsRegister(v => !v); setError(null); }}
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

const Field: React.FC<{
  icon: React.ReactNode; type: string; placeholder: string;
  label: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
}> = ({ icon, type, placeholder, label, value, onChange, required }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
      style={{ color: 'var(--text-dim)' }}>
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }}>
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none transition-colors"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  </div>
);
