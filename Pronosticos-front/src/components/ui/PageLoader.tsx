import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  /** Texto accesible / visible bajo el spinner */
  label?: string;
  className?: string;
}

/** Overlay a pantalla completa, centrado, con fondo opaco. */
export const PageLoader: React.FC<PageLoaderProps> = ({
  label = 'Cargando predicciones…',
  className = '',
}) => (
  <div
    className={`page-loader ${className}`.trim()}
    role="status"
    aria-busy="true"
    aria-live="polite"
    aria-label={label}
  >
    <Loader2 size={28} className="page-loader__spin" aria-hidden />
    <p className="page-loader__label">{label}</p>
  </div>
);
