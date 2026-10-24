import React from 'react';

interface TeamCrestProps {
  src?: string;
  name: string;
  size?: number;
  rounded?: 'full' | 'lg';
}

export const TeamCrest: React.FC<TeamCrestProps> = ({
  src,
  name,
  size = 28,
  rounded = 'full',
}) => {
  const radius = rounded === 'full' ? '999px' : 'var(--radius-md)';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="object-contain flex-shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: 'transparent',
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center font-bold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: Math.max(9, size * 0.32),
        background: 'var(--surface2)',
        color: 'var(--text-dim)',
        border: '1px solid var(--border)',
      }}
      aria-hidden
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
};
