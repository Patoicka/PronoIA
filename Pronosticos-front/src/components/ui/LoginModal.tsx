import React, { useEffect, useId, useRef, useState } from 'react';
import { X, Mail, Lock, User, Phone, Calendar, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_COUNTRY_CODE, dialForCountry } from '../../data/countryDialCodes';
import { DialCodeSelect } from './DialCodeSelect';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Abre directamente en modo registro (CTA "Crear cuenta"). */
  startInRegister?: boolean;
}

const API_ROOT = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8002').replace(/\/$/, '');

const emptyLogin = { correo: '', password: '' };
const emptyRegister = {
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  correo: '',
  countryCode: DEFAULT_COUNTRY_CODE,
  telefonoLocal: '',
  password: '',
  password2: '',
};

function formatApiError(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === 'object' && d && 'msg' in d ? String((d as { msg: string }).msg) : String(d)))
      .join('. ');
  }
  return 'Error desconocido';
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  startInRegister = false,
}) => {
  const { login } = useAuth();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const scrollYRef = useRef(0);

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegPass2, setShowRegPass2] = useState(false);

  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [registerForm, setRegisterForm] = useState(emptyRegister);

  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    scrollYRef.current = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    setIsRegister(startInRegister);
    setError(null);
    setLoginForm(emptyLogin);
    setRegisterForm(emptyRegister);
    setShowLoginPass(false);
    setShowRegPass(false);
    setShowRegPass2(false);
    setLoading(false);

    const t = window.setTimeout(() => {
      // Preferir el primer campo; si no, el botón cerrar
      const firstField = panelRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), button.auth-close',
      );
      (firstField ?? closeBtnRef.current)?.focus();
    }, 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loadingRef.current) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute('disabled') && (el.offsetParent !== null || el === document.activeElement),
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollYRef.current);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, startInRegister]);

  if (!isOpen) return null;

  const setLogin =
    (k: keyof typeof emptyLogin) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setLoginForm((f) => ({ ...f, [k]: e.target.value }));

  const setRegister =
    (k: keyof typeof emptyRegister) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setRegisterForm((f) => ({ ...f, [k]: e.target.value }));

  const switchMode = (nextRegister: boolean) => {
    setIsRegister(nextRegister);
    setError(null);
    if (nextRegister) setRegisterForm(emptyRegister);
    else setLoginForm(emptyLogin);
    setShowLoginPass(false);
    setShowRegPass(false);
    setShowRegPass2(false);
  };

  const selectedDial = dialForCountry(registerForm.countryCode);

  const buildPhone = (): string | undefined => {
    const local = registerForm.telefonoLocal.replace(/\D/g, '');
    if (!local) return undefined;
    return `${selectedDial}${local}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && registerForm.password !== registerForm.password2) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? {
            nombres: registerForm.nombres,
            apellidos: registerForm.apellidos,
            fecha_nacimiento: registerForm.fecha_nacimiento || undefined,
            correo: registerForm.correo,
            telefono: buildPhone(),
            password: registerForm.password,
          }
        : { correo: loginForm.correo, password: loginForm.password };

      const res = await fetch(`${API_ROOT}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatApiError(data.detail) || `Error ${res.status}`);
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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-5 auth-backdrop"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="auth-panel fade-in w-full flex flex-col"
        style={{
          animationDuration: '0.22s',
          maxWidth: isRegister ? '38rem' : '28rem',
          maxHeight: 'calc(100dvh - 32px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo */}
        <div className="relative flex-shrink-0 px-6 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-5">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="auth-close absolute right-4 top-4 sm:right-5 sm:top-5 z-10"
            type="button"
            aria-label="Cerrar"
            disabled={loading}
          >
            <X size={16} />
          </button>

          <div className="flex flex-col items-center text-center pt-1">
            <div className="flex items-center gap-2.5 mb-3.5">
              <img
                src="/logo-mark.png"
                alt=""
                width={36}
                height={36}
                className="w-9 h-9 object-contain"
                aria-hidden
              />
              <span className="text-brand text-xl leading-none" style={{ color: 'var(--text)' }}>
                Kronos
              </span>
            </div>
            <h2 id={titleId} className="text-title mb-1" style={{ fontSize: '1.375rem' }}>
              {isRegister ? 'Crear cuenta' : 'Bienvenido'}
            </h2>
            <p className="text-meta" style={{ color: 'var(--text-muted)' }}>
              {isRegister ? 'Únete y guarda tus picks' : 'Inicia sesión para continuar'}
            </p>
          </div>
        </div>

        {/* Cuerpo con scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-2 sm:px-7 hide-scrollbar">
          <form
            key={isRegister ? 'kronos-register' : 'kronos-login'}
            onSubmit={handleSubmit}
            className="flex flex-col"
            style={{ gap: '1rem' }}
            autoComplete="on"
          >
            {isRegister ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    icon={<User size={16} />}
                    type="text"
                    name="reg_nombres"
                    placeholder="Nombre(s)"
                    label="Nombres"
                    value={registerForm.nombres}
                    onChange={setRegister('nombres')}
                    required
                    autoComplete="given-name"
                  />
                  <Field
                    icon={<User size={16} />}
                    type="text"
                    name="reg_apellidos"
                    placeholder="Apellido(s)"
                    label="Apellidos"
                    value={registerForm.apellidos}
                    onChange={setRegister('apellidos')}
                    required
                    autoComplete="family-name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    icon={<Calendar size={16} />}
                    type="date"
                    name="reg_fecha"
                    placeholder=""
                    label="Fecha de nacimiento"
                    value={registerForm.fecha_nacimiento}
                    onChange={setRegister('fecha_nacimiento')}
                    autoComplete="bday"
                  />
                  <div>
                    <label className="auth-label" htmlFor="reg_telefono">
                      Teléfono
                    </label>
                    <div className="flex gap-2">
                      <DialCodeSelect
                        value={registerForm.countryCode}
                        onChange={(c) => setRegisterForm((f) => ({ ...f, countryCode: c.code }))}
                      />
                      <div className="relative flex-1 min-w-0">
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: 'var(--text-dim)' }}
                          aria-hidden
                        >
                          <Phone size={16} />
                        </span>
                        <input
                          id="reg_telefono"
                          type="tel"
                          name="reg_telefono"
                          inputMode="numeric"
                          placeholder="55 0000 0000"
                          value={registerForm.telefonoLocal}
                          onChange={setRegister('telefonoLocal')}
                          autoComplete="tel-national"
                          className="field-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Field
                  icon={<Mail size={16} />}
                  type="email"
                  name="reg_correo"
                  placeholder="tu@correo.com"
                  label="Correo"
                  value={registerForm.correo}
                  onChange={setRegister('correo')}
                  required
                  autoComplete="email"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    icon={<Lock size={16} />}
                    type={showRegPass ? 'text' : 'password'}
                    name="reg_password"
                    placeholder="••••••••"
                    label="Contraseña"
                    value={registerForm.password}
                    onChange={setRegister('password')}
                    required
                    autoComplete="new-password"
                    toggle={{
                      shown: showRegPass,
                      onToggle: () => setShowRegPass((v) => !v),
                    }}
                  />
                  <Field
                    icon={<Lock size={16} />}
                    type={showRegPass2 ? 'text' : 'password'}
                    name="reg_password2"
                    placeholder="••••••••"
                    label="Confirmar contraseña"
                    value={registerForm.password2}
                    onChange={setRegister('password2')}
                    required
                    autoComplete="new-password"
                    toggle={{
                      shown: showRegPass2,
                      onToggle: () => setShowRegPass2((v) => !v),
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <Field
                  icon={<Mail size={16} />}
                  type="email"
                  name="login_correo"
                  placeholder="tu@correo.com"
                  label="Correo"
                  value={loginForm.correo}
                  onChange={setLogin('correo')}
                  required
                  autoComplete="username"
                />
                <Field
                  icon={<Lock size={16} />}
                  type={showLoginPass ? 'text' : 'password'}
                  name="login_password"
                  placeholder="••••••••"
                  label="Contraseña"
                  value={loginForm.password}
                  onChange={setLogin('password')}
                  required
                  autoComplete="current-password"
                  toggle={{
                    shown: showLoginPass,
                    onToggle: () => setShowLoginPass((v) => !v),
                  }}
                />
              </>
            )}

            {error && (
              <p
                className="text-xs text-center px-3 py-2.5 rounded-lg"
                style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                role="alert"
              >
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="auth-btn mt-1">
              {loading ? 'Cargando…' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 pt-4 pb-6 sm:px-7 sm:pb-7 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <button
              type="button"
              onClick={() => switchMode(!isRegister)}
              className="font-bold focus-ring rounded-sm"
              style={{ color: 'var(--accent)' }}
              disabled={loading}
            >
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{
  icon: React.ReactNode;
  type: string;
  name: string;
  placeholder: string;
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  autoComplete?: string;
  toggle?: { shown: boolean; onToggle: () => void };
}> = ({ icon, type, name, placeholder, label, value, onChange, required, autoComplete, toggle }) => (
  <div>
    <label className="auth-label" htmlFor={name}>
      {label}
    </label>
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-dim)' }}
        aria-hidden
      >
        {icon}
      </span>
      <input
        type={type}
        name={name}
        id={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className={`field-input${toggle ? ' has-toggle' : ''}`}
      />
      {toggle && (
        <button
          type="button"
          onClick={toggle.onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md focus-ring"
          style={{ color: 'var(--text-dim)' }}
          aria-label={toggle.shown ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {toggle.shown ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  </div>
);
