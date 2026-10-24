import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { COUNTRY_DIAL_CODES, type CountryDialCode } from '../../data/countryDialCodes';

interface DialCodeSelectProps {
  value: string; // ISO country code, e.g. "MX"
  onChange: (country: CountryDialCode) => void;
  disabled?: boolean;
}

export const DialCodeSelect: React.FC<DialCodeSelectProps> = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected =
    COUNTRY_DIAL_CODES.find((c) => c.code === value) ?? COUNTRY_DIAL_CODES[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" style={{ width: '8.25rem' }} ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="field-input select-input !pl-2.5 !pr-7 flex items-center gap-1 text-left"
        style={{
          borderColor: open ? 'var(--accent-border)' : undefined,
          boxShadow: open ? '0 0 0 3px rgba(245, 158, 11, 0.12)' : undefined,
        }}
      >
        <span className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {selected.code} {selected.dial}
        </span>
        <ChevronDown
          size={14}
          className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-dim)' }}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Lada del país"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-56 max-h-56 overflow-y-auto rounded-[var(--radius-md)] hide-scrollbar"
          style={{
            background: 'linear-gradient(165deg, rgba(31, 41, 64, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)',
            border: '1px solid rgba(91, 110, 160, 0.55)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {COUNTRY_DIAL_CODES.map((c) => {
            const active = c.code === selected.code;
            return (
              <button
                key={c.code}
                type="button"
                role="option"
                aria-selected={active}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
                style={{
                  background: active ? 'var(--accent-bg)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text)',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = active ? 'var(--accent-bg)' : 'transparent';
                }}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
              >
                <span className="font-bold w-8 shrink-0 text-mono text-xs" style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {c.code}
                </span>
                <span className="flex-1 min-w-0 truncate" style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}>
                  {c.name}
                </span>
                <span className="text-mono text-xs shrink-0" style={{ color: active ? 'var(--accent)' : 'var(--text-dim)' }}>
                  {c.dial}
                </span>
                {active && <Check size={13} className="shrink-0" style={{ color: 'var(--accent)' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
