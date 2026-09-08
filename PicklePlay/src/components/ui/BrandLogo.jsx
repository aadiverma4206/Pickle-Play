import { useId } from 'react';

export default function BrandLogo({ size = 'md', showText = false, textClassName = '' }) {
  const reactId = useId();
  const id = reactId.replace(/[^a-zA-Z0-9_-]/g, '');

  const sizeMap = {
    sm: 'size-7',
    md: 'size-9',
    lg: 'size-11',
    xl: 'size-14',
  };

  const dim = sizeMap[size] || sizeMap.md;

  const bgId = `logoBg-${id}`;
  const paddleId = `logoPaddle-${id}`;
  const ballId = `logoBall-${id}`;
  const accentId = `logoAccent-${id}`;

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0 select-none">
      <div className={`relative ${dim} shrink-0`}>
        <svg
          viewBox="0 0 64 64"
          className="size-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>
            <linearGradient id={paddleId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id={ballId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id={accentId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>

          {/* Outer Container Badge */}
          <rect width="64" height="64" rx="16" fill={`url(#${bgId})`} />
          <rect width="62" height="62" x="1" y="1" rx="15" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.4" />

          {/* Dynamic Velocity Arc */}
          <path d="M 8 50 Q 32 60 56 50" fill="none" stroke={`url(#${accentId})`} strokeWidth="2" strokeLinecap="round" opacity="0.6" />

          {/* Paddle */}
          <g transform="translate(4, -2) rotate(-15 32 32)">
            <rect x="29" y="40" width="6" height="15" rx="3" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
            <line x1="29" y1="44" x2="35" y2="44" stroke="#64748b" strokeWidth="1.2" />
            <line x1="29" y1="48" x2="35" y2="48" stroke="#64748b" strokeWidth="1.2" />
            <line x1="29" y1="52" x2="35" y2="52" stroke="#64748b" strokeWidth="1.2" />
            
            <rect x="18" y="12" width="28" height="32" rx="10" fill={`url(#${paddleId})`} stroke="#4ade80" strokeWidth="1.5" />
            <circle cx="32" cy="28" r="8" fill="none" stroke="#bbf7d0" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.8" />
            <path d="M 29 23 L 29 33 M 29 23 L 33 23 C 35.5 23 35.5 28 33 28 L 29 28" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Glowing Wiffle Ball */}
          <g transform="translate(43, 19)">
            <circle cx="0" cy="0" r="8" fill={`url(#${ballId})`} stroke="#fef08a" strokeWidth="1" />
            <circle cx="-3" cy="-3" r="1.2" fill="#713f12" opacity="0.85" />
            <circle cx="3" cy="-3" r="1.2" fill="#713f12" opacity="0.85" />
            <circle cx="0" cy="0" r="1.4" fill="#713f12" opacity="0.85" />
            <circle cx="-3.5" cy="2.5" r="1.2" fill="#713f12" opacity="0.85" />
            <circle cx="3.5" cy="2.5" r="1.2" fill="#713f12" opacity="0.85" />
          </g>
        </svg>
      </div>

      {showText && (
        <span className={`font-extrabold tracking-tight text-ink-900 ${textClassName || 'text-lg'}`}>
          Pickle<span className="text-emerald-600">Play</span>
        </span>
      )}
    </div>
  );
}
