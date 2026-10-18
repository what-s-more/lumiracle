interface MagicDividerProps {
  className?: string;
}

export default function MagicDivider({ className = '' }: MagicDividerProps) {
  return (
    <div className={`relative my-10 ${className}`} aria-hidden="true">
      <svg width="100%" height="20" viewBox="0 0 800 20" preserveAspectRatio="none" className="w-full">
        <defs>
          <linearGradient id="magicLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--accent)" stopOpacity="0.6" />
            <stop offset="50%" stopColor="var(--accent-secondary)" stopOpacity="1" />
            <stop offset="80%" stopColor="var(--accent)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line x1="0" y1="10" x2="800" y2="10" stroke="url(#magicLine)" strokeWidth="1.5" filter="url(#glow)" />
        <text x="400" y="14" textAnchor="middle" fill="var(--accent)" fontSize="10" opacity="0.5">✦</text>
      </svg>
    </div>
  );
}
