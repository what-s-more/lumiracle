'use client';

interface MagicCircleProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function MagicCircle({ size = 200, className = '', animate = true }: MagicCircleProps) {
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
        <linearGradient id="mc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="50%" stopColor="var(--accent-light)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="mc-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-light)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id="mc-grad-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-light)" stopOpacity="1" />
          <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 外圈双环 — 逆时针 30s */}
      <g style={animate ? { animation: 'mc-spin-ccw 30s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="95" stroke="url(#mc-grad)" strokeWidth="3" fill="none" />
        <circle cx="100" cy="100" r="90" stroke="url(#mc-grad-light)" strokeWidth="1" fill="none" />
      </g>

      {/* 第二层环 — 顺时针 25s */}
      <g style={animate ? { animation: 'mc-spin-cw 25s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="82" stroke="url(#mc-grad)" strokeWidth="2" fill="none" opacity="0.8" />
        <circle cx="100" cy="100" r="78" stroke="url(#mc-grad-light)" strokeWidth="1" fill="none" strokeDasharray="4 3" />
      </g>

      {/* 装饰光点 — 逆时针 18s */}
      <g style={animate ? { animation: 'mc-spin-ccw 18s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <g fill="var(--accent)">
          <circle cx="100" cy="10" r="5" />
          <circle cx="190" cy="100" r="5" />
          <circle cx="100" cy="190" r="5" />
          <circle cx="10" cy="100" r="5" />
        </g>
        <g fill="var(--accent-light)" opacity="0.9">
          <circle cx="163" cy="37" r="3" />
          <circle cx="163" cy="163" r="3" />
          <circle cx="37" cy="163" r="3" />
          <circle cx="37" cy="37" r="3" />
        </g>
      </g>

      {/* 第三层环 — 顺时针 8s */}
      <g style={animate ? { animation: 'mc-spin-cw 8s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="70" stroke="url(#mc-grad)" strokeWidth="1.5" fill="none" opacity="0.7" />
      </g>

      {/* 六芒星 — 呼吸脉冲 3s */}
      <g style={animate ? { animation: 'mc-pulse 3s ease-in-out infinite', transformOrigin: '100px 100px' } : undefined}>
        <polygon points="100,30 150,130 50,130" stroke="url(#mc-grad)" strokeWidth="2" fill="none" />
        <polygon points="100,170 50,70 150,70" stroke="url(#mc-grad)" strokeWidth="2" fill="none" />
      </g>

      {/* 第四层环 — 逆时针 10s */}
      <g style={animate ? { animation: 'mc-spin-ccw 10s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="55" stroke="url(#mc-grad)" strokeWidth="1.5" fill="none" />
        <circle cx="100" cy="100" r="48" stroke="url(#mc-grad-light)" strokeWidth="1" fill="none" strokeDasharray="3 4" />
      </g>

      {/* 中心圣光 */}
      <g>
        <circle cx="100" cy="100" r="25" fill="url(#mc-grad-core)" />
        <circle cx="100" cy="100" r="12" fill="var(--accent)" opacity="0.9" />
        <circle cx="100" cy="100" r="6" fill="var(--accent-light)" />
      </g>

      {/* 旋转符文 ❋ — 顺时针 25s */}
      <g style={animate ? { animation: 'mc-spin-cw 25s linear infinite', transformOrigin: '100px 100px' } : undefined}
        fill="var(--accent)" fontSize="8px" fontFamily="serif">
        <text x="100" y="42" textAnchor="middle" opacity="0.8">❋</text>
        <text x="158" y="103" textAnchor="middle" opacity="0.8">❋</text>
        <text x="100" y="164" textAnchor="middle" opacity="0.8">❋</text>
        <text x="42" y="103" textAnchor="middle" opacity="0.8">❋</text>
      </g>

      <style>{`
        @keyframes mc-spin-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes mc-spin-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes mc-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </svg>
  );
}
