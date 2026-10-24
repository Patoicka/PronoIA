import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Lock, Save, LogOut, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8002').replace(/\/$/, '');

export const Profile: React.FC = () => {
  const { user, token, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombres: user?.nombres ?? '',
    apellidos: user?.apellidos ?? '',
    fecha_nacimiento: user?.fecha_nacimiento ?? '',
    telefono: user?.telefono ?? '',
  });

  const [pwForm, setPwForm] = useState({ current: '', nueva: '', confirmar: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [msgPw, setMsgPw] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  if (!user) {
    navigate('/');
    return null;
  }

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPw =
    (k: keyof typeof pwForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setPwForm((f) => ({ ...f, [k]: e.target.value }));

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_ROOT}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'err', text: data.detail ?? 'Error al guardar' });
        return;
      }
      updateUser(data);
      setMsg({ type: 'ok', text: 'Datos actualizados correctamente' });
    } catch {
      setMsg({ type: 'err', text: 'No se pudo conectar al servidor' });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.nueva !== pwForm.confirmar) {
      setMsgPw({ type: 'err', text: 'Las contraseñas no coinciden' });
      return;
    }
    setSavingPw(true);
    setMsgPw(null);
    try {
      const res = await fetch(`${API_ROOT}/api/auth/me/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.nueva }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsgPw({ type: 'err', text: data.detail ?? 'Error al cambiar contraseña' });
        return;
      }
      setMsgPw({ type: 'ok', text: 'Contraseña actualizada' });
      setPwForm({ current: '', nueva: '', confirmar: '' });
    } catch {
      setMsgPw({ type: 'err', text: 'No se pudo conectar al servidor' });
    } finally {
      setSavingPw(false);
    }
  };

  const initials = `${user.nombres[0] ?? ''}${user.apellidos[0] ?? ''}`.toUpperCase();

  return (
    <section className="max-w-3xl mx-auto stack-dense fade-in">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg transition hover:bg-white/5"
          style={{ color: 'var(--text-muted)' }}
          type="button"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-title">Mi perfil</h1>
      </div>

      <div className="panel p-4 flex flex-wrap items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black flex-shrink-0 text-mono"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)', boxShadow: 'var(--shadow-accent)' }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--text)' }}>
            {user.nombres} {user.apellidos}
          </p>
          <p className="text-meta truncate">{user.correo}</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition hover:opacity-90"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }}
          type="button"
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="text-meta uppercase tracking-wide font-bold mb-3">Datos personales</h2>
          <form onSubmit={saveProfile} className="stack-dense">
            <ProfileField
              icon={<User size={15} />}
              label="Nombres"
              type="text"
              value={form.nombres}
              onChange={set('nombres')}
              required
            />
            <ProfileField
              icon={<User size={15} />}
              label="Apellidos"
              type="text"
              value={form.apellidos}
              onChange={set('apellidos')}
              required
            />
            <ProfileField
              icon={<Mail size={15} />}
              label="Correo"
              type="email"
              value={user.correo}
              onChange={() => {}}
              disabled
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ProfileField
                icon={<Phone size={15} />}
                label="Teléfono"
                type="tel"
                value={form.telefono}
                onChange={set('telefono')}
              />
              <ProfileField
                icon={<Calendar size={15} />}
                label="Nacimiento"
                type="date"
                value={form.fecha_nacimiento}
                onChange={set('fecha_nacimiento')}
              />
            </div>

            {msg && (
              <p
                className="text-xs px-3 py-2 rounded-lg text-center"
                style={{
                  background: msg.type === 'ok' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: msg.type === 'ok' ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {msg.text}
              </p>
            )}

            <button type="submit" disabled={saving} className="btn-primary w-full">
              <Save size={14} /> {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        <div className="panel p-4">
          <h2 className="text-meta uppercase tracking-wide font-bold mb-3">Cambiar contraseña</h2>
          <form onSubmit={savePassword} className="stack-dense">
            <ProfileField
              icon={<Lock size={15} />}
              label="Contraseña actual"
              type="password"
              value={pwForm.current}
              onChange={setPw('current')}
              required
            />
            <ProfileField
              icon={<Lock size={15} />}
              label="Nueva contraseña"
              type="password"
              value={pwForm.nueva}
              onChange={setPw('nueva')}
              required
            />
            <ProfileField
              icon={<Lock size={15} />}
              label="Confirmar nueva"
              type="password"
              value={pwForm.confirmar}
              onChange={setPw('confirmar')}
              required
            />

            {msgPw && (
              <p
                className="text-xs px-3 py-2 rounded-lg text-center"
                style={{
                  background: msgPw.type === 'ok' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: msgPw.type === 'ok' ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {msgPw.text}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPw}
              className="focus-ring flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius-sm)] text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                color: 'var(--text)',
                border: '1px solid var(--border2)',
              }}
            >
              <Lock size={14} /> {savingPw ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

const ProfileField: React.FC<{
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  disabled?: boolean;
}> = ({ icon, label, type, value, onChange, required, disabled }) => (
  <div>
    <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }}>
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="field-input disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  </div>
);
