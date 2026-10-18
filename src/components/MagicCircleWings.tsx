'use client';

interface MagicCircleWingsProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function MagicCircleWings({ size = 200, className = '', animate = true }: MagicCircleWingsProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-light)" stopOpacity="1" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent-light)" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="mw-wing" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id="mw-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-light)" stopOpacity="1" />
          <stop offset="40%" stopColor="var(--accent-light)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 外圈 */}
      <g style={animate ? { animation: 'mc-spin-ccw 30s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="95" stroke="url(#mw-grad)" strokeWidth="2.5" fill="none" />
        <circle cx="100" cy="100" r="90" stroke="url(#mw-grad)" strokeWidth="1" fill="none" opacity="0.6" strokeDasharray="4 4" />
      </g>

      {/* 天使羽翼 */}
      <g>
        <g fill="url(#mw-wing)" opacity="0.7">
          {/* 左翼 */}
          <path d="M100 100 Q60 60 20 80 Q40 90 50 110 Q60 130 100 100" />
          <path d="M100 100 Q70 70 35 85 Q50 95 60 115 Q70 130 100 100" />
          <path d="M100 100 Q80 80 50 92 Q60 102 68 120 Q75 135 100 100" />
          {/* 右翼 */}
          <path d="M100 100 Q140 60 180 80 Q160 90 150 110 Q140 130 100 100" />
          <path d="M100 100 Q130 70 165 85 Q150 95 140 115 Q130 130 100 100" />
          <path d="M100 100 Q120 80 150 92 Q140 102 132 120 Q125 135 100 100" />
        </g>
      </g>

      {/* 光环 */}
      <g style={animate ? { animation: 'mc-spin-ccw 18s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="80" stroke="url(#mw-grad)" strokeWidth="1.5" fill="none" opacity="0.7" />
        <circle cx="100" cy="100" r="72" stroke="var(--accent)" strokeWidth="1" fill="none" strokeDasharray="3 5" />
      </g>

      {/* 六芒星 */}
      <g style={animate ? { animation: 'mc-pulse 3s ease-in-out infinite', transformOrigin: '100px 100px' } : undefined}>
        <polygon points="100,25 155,137.5 45,137.5" stroke="url(#mw-grad)" strokeWidth="1.5" fill="none" />
        <polygon points="100,175 45,62.5 155,62.5" stroke="url(#mw-grad)" strokeWidth="1.5" fill="none" />
      </g>

      {/* 内圈 */}
      <g style={animate ? { animation: 'mc-spin-cw 8s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="55" stroke="url(#mw-grad)" strokeWidth="1.5" fill="none" />
      </g>
      <g style={animate ? { animation: 'mc-spin-ccw 10s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="45" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.8" />
      </g>

      {/* 中心圣光 */}
      <g>
        <circle cx="100" cy="100" r="30" fill="url(#mw-center)" />
        <circle cx="100" cy="100" r="18" fill="var(--accent)" opacity="0.8" />
        <circle cx="100" cy="100" r="10" fill="var(--accent-light)" />
      </g>

      {/* 装饰光点 */}
      <g style={animate ? { animation: 'mc-spin-cw 25s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="10" r="4" fill="var(--accent)" />
        <circle cx="190" cy="100" r="4" fill="var(--accent)" />
        <circle cx="100" cy="190" r="4" fill="var(--accent)" />
        <circle cx="10" cy="100" r="4" fill="var(--accent)" />
        <circle cx="160" cy="40" r="3" fill="var(--accent-light)" opacity="0.8" />
        <circle cx="160" cy="160" r="3" fill="var(--accent-light)" opacity="0.8" />
        <circle cx="40" cy="160" r="3" fill="var(--accent-light)" opacity="0.8" />
        <circle cx="40" cy="40" r="3" fill="var(--accent-light)" opacity="0.8" />
      </g>
    </svg>
  );
}
