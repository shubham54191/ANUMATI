/**
 * The plant at the foot of the panel.
 *
 * Drawn rather than photographed: this build ships no stock imagery, and a
 * licensed photograph can replace this component without touching anything
 * around it.
 */
export function PlantScene({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 760 340" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="ps-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9C8E4" />
          <stop offset="0.45" stopColor="#CBDCEB" />
          <stop offset="0.78" stopColor="#EBDCC4" />
          <stop offset="1" stopColor="#F2E3C8" />
        </linearGradient>
        <linearGradient id="ps-ridge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FA7BD" />
          <stop offset="1" stopColor="#B9CAD8" />
        </linearGradient>
        <linearGradient id="ps-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#84AC5C" />
          <stop offset="0.5" stopColor="#628F41" />
          <stop offset="1" stopColor="#3F6B2C" />
        </linearGradient>
        <linearGradient id="ps-silo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B9C6D2" />
          <stop offset="0.3" stopColor="#FAFCFD" />
          <stop offset="0.72" stopColor="#E4EAF0" />
          <stop offset="1" stopColor="#A9B8C6" />
        </linearGradient>
        <linearGradient id="ps-block" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EFF4F8" />
          <stop offset="1" stopColor="#C8D3DD" />
        </linearGradient>
        <linearGradient id="ps-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FA2B4" />
          <stop offset="1" stopColor="#AEBDCA" />
        </linearGradient>
      </defs>

      <rect width="760" height="340" fill="url(#ps-sky)" />
      <ellipse cx="560" cy="196" rx="220" ry="54" fill="#F7E7C9" opacity="0.55" />

      {/* far ridge */}
      <path
        d="M0 158 L90 132 L170 150 L250 120 L340 146 L430 124 L520 150 L620 128 L700 152 L760 138 L760 210 L0 210 Z"
        fill="url(#ps-ridge)"
        opacity="0.62"
      />

      {/* low shed, left */}
      <rect x="28" y="168" width="136" height="48" fill="url(#ps-block)" />
      <path d="M24 168 L96 152 L168 168 Z" fill="url(#ps-roof)" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={42 + i * 21} y="182" width="12" height="22" fill="#96AABD" opacity="0.55" />
      ))}

      {/* silo cluster */}
      {[186, 218, 250, 282].map((x, i) => {
        const top = 96 + (i % 2) * 10;
        return (
          <g key={x}>
            <rect x={x} y={top} width="27" height={216 - top} fill="url(#ps-silo)" />
            <ellipse cx={x + 13.5} cy={top} rx="13.5" ry="5.5" fill="#F4F8FB" />
            <rect x={x} y={top + 34} width="27" height="2.5" fill="#B7C4D0" opacity="0.7" />
            <rect x={x} y={top + 74} width="27" height="2.5" fill="#B7C4D0" opacity="0.7" />
          </g>
        );
      })}
      <rect x="180" y="88" width="121" height="6" rx="2" fill="#AAB9C7" />
      <rect x="236" y="70" width="4" height="20" fill="#AAB9C7" />

      {/* main processing hall */}
      <rect x="318" y="140" width="226" height="76" fill="url(#ps-block)" />
      <path d="M312 140 L431 118 L550 140 Z" fill="url(#ps-roof)" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={332 + i * 24} y="158" width="15" height="30" fill="#93A8BC" opacity="0.5" />
      ))}
      <rect x="470" y="96" width="16" height="44" fill="#D6DFE7" />
      <rect x="468" y="93" width="20" height="5" rx="2" fill="#B5C2CE" />

      {/* right block + stack */}
      <rect x="562" y="156" width="112" height="60" fill="url(#ps-block)" />
      <path d="M556 156 L618 140 L680 156 Z" fill="url(#ps-roof)" />
      <rect x="692" y="112" width="14" height="104" fill="#D9E1E8" />
      <rect x="690" y="109" width="18" height="5" rx="2" fill="#B5C2CE" />

      {/* hedge line */}
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={10 + i * 26} cy={218} r={12 + ((i * 5) % 6)} fill="#43702F" opacity="0.9" />
      ))}
      <rect x="0" y="216" width="760" height="16" fill="#43702F" opacity="0.7" />

      {/* fields */}
      <rect x="0" y="228" width="760" height="112" fill="url(#ps-field)" />
      {Array.from({ length: 10 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${240 + i * 11} Q 380 ${232 + i * 11} 760 ${246 + i * 11}`}
          stroke="#7CA556"
          strokeWidth="2.5"
          fill="none"
          opacity="0.35"
        />
      ))}
    </svg>
  );
}
