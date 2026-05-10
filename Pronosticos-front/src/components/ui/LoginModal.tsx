import React, { useEffect, useState } from 'react';
import { X, Target, Mail, Lock } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsRegister(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div 
        className="rounded-2xl max-w-md w-full overflow-hidden fade-in" 
        style={{ background: '#141414', border: '1px solid #1e1e1e', animationDuration: '0.3s' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 relative text-center border-b" style={{ borderColor: '#1a1a1a' }}>
          <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-lg hover:bg-white/5 transition text-[#888] hover:text-white">
            <X style={{ width: '20px', height: '20px' }} />
          </button>
          
          <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg,#c85000,#22783c)' }}>
            <Target style={{ width: '24px', height: '24px', color: '#fff' }} />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            {isRegister ? 'Crear una cuenta' : 'Bienvenido de nuevo'}
          </h3>
          <p className="text-sm" style={{ color: '#888' }}>
            {isRegister ? 'Únete a ProPredict para ver todos los análisis' : 'Inicia sesión para acceder a tus predicciones'}
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#888', textTransform: 'uppercase' }}>Nombre Completo</label>
                <div className="relative">
                  <input type="text" placeholder="Tu nombre" className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c85000] transition" />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#888', textTransform: 'uppercase' }}>Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input type="email" placeholder="tu@correo.com" className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c85000] transition" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#888', textTransform: 'uppercase' }}>Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input type="password" placeholder="••••••••" className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c85000] transition" />
              </div>
            </div>
          </div>

          {!isRegister && (
            <div className="text-right">
              <button className="text-xs font-medium hover:underline transition" style={{ color: '#c85000' }}>¿Olvidaste tu contraseña?</button>
            </div>
          )}

          <button className="w-full font-bold py-2.5 rounded-lg text-white transition hover:opacity-90 mt-2 shadow-lg" style={{ background: 'linear-gradient(90deg, #c85000, #22783c)' }}>
            {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </div>

        <div className="p-4 text-center border-t" style={{ borderColor: '#1a1a1a', background: '#0a0a0a' }}>
          <p className="text-sm" style={{ color: '#888' }}>
            {isRegister ? '¿Ya tienes una cuenta? ' : '¿No tienes una cuenta? '}
            <button 
              onClick={() => setIsRegister(!isRegister)} 
              className="font-bold hover:underline transition" 
              style={{ color: '#c85000' }}
            >
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
