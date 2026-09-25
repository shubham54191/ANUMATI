/**
 * The scene behind the whole left panel: sky at the top, a food-processing
 * plant on the horizon, fields at the foot. The brand content sits over the
 * sky, so this is one continuous image rather than a band pasted at the bottom.
 *
 * The horizon is held at 68% of the frame and the fields start at 86%, which is
 * where they fall in the approved design — the headline, paragraph and pillars
 * all sit over clear sky above it.
 *
 * Drawn rather than photographed: this build ships no stock imagery, so there
 * is no licence to breach. To use a photograph instead, drop it in at
 * `public/brand/plant.jpg` and swap this component for an <img> with the same
 * `absolute inset-0 h-full w-full object-cover` classes — nothing else on the
 * page changes.
 */
export function PlantScene({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 820 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="ps-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C8DCEF" />
          <stop offset="0.38" stopColor="#DCE9F4" />
          <stop offset="0.6" stopColor="#E9F0F5" />
          <stop offset="0.72" stopColor="#F1E9DC" />
          <stop offset="0.86" stopColor="#F3E5CC" />
          <stop offset="1" stopColor="#F3E5CC" />
        </linearGradient>
        <linearGradient id="ps-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9DB4CA" />
          <stop offset="1" stopColor="#CEDBE5" />
        </linearGradient>
        <linearGradient id="ps-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8BA3BA" />
          <stop offset="1" stopColor="#B8C9D7" />
        </linearGradient>
        <linearGradient id="ps-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8DB464" />
          <stop offset="0.4" stopColor="#699546" />
          <stop offset="1" stopColor="#33591F" />
        </linearGradient>
        <linearGradient id="ps-silo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#AEBDCA" />
          <stop offset="0.28" stopColor="#FAFCFD" />
          <stop offset="0.7" stopColor="#E2E9EF" />
          <stop offset="1" stopColor="#9FB0BE" />
        </linearGradient>
        <linearGradient id="ps-block" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3F7FA" />
          <stop offset="1" stopColor="#C6D2DD" />
        </linearGradient>
        <linearGradient id="ps-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6E88A0" />
          <stop offset="1" stopColor="#9DAFBF" />
        </linearGradient>
        <radialGradient id="ps-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4DC" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFF4DC" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ps-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0EADE" stopOpacity="0" />
          <stop offset="1" stopColor="#F0EADE" stopOpacity="0.58" />
        </linearGradient>
      </defs>

      <rect width="820" height="1000" fill="url(#ps-sky)" />
      <ellipse cx="600" cy="690" rx="330" ry="150" fill="url(#ps-sun)" />

      {/* a little cloud, kept high and faint so nothing competes with the text */}
      <g fill="#FFFFFF" opacity="0.32">
        <ellipse cx="642" cy="196" rx="140" ry="24" />
        <ellipse cx="556" cy="182" rx="82" ry="18" />
      </g>

      {/* two ranges, the far one hazier */}
      <path
        d="M0 726 L78 690 L142 714 L214 678 L300 716 L372 688 L452 720 L540 684 L628 718 L712 692 L790 722 L820 706 L820 800 L0 800 Z"
        fill="url(#ps-far)"
        opacity="0.46"
      />
      <path
        d="M0 752 L96 724 L186 748 L286 720 L392 750 L500 726 L610 752 L724 728 L820 750 L820 810 L0 810 Z"
        fill="url(#ps-near)"
        opacity="0.38"
      />
      <rect x="0" y="690" width="820" height="130" fill="url(#ps-haze)" />

      {/* --- the plant --- */}
      <g transform="translate(0,-12)">

      {/* lattice tower and stack, far left */}
      <g stroke="#9DADBB" strokeWidth="2.6" fill="none" opacity="0.9">
        <path d="M58 852 L76 720 L112 720 L126 852 M76 720 L112 720" />
        <path d="M66 800 L118 800 M70 766 L114 766 M73 740 L111 740" />
        <path d="M66 800 L114 766 M70 766 L111 740 M69 836 L122 800" />
      </g>
      <rect x="140" y="736" width="16" height="116" fill="#DCE4EB" />
      <rect x="137" y="731" width="22" height="6" rx="3" fill="#AEBDCA" />

      {/* silo cluster */}
      {[196, 229, 262, 295, 328].map((x, i) => {
        const top = 750 + (i % 2) * 14;
        return (
          <g key={x}>
            <rect x={x} y={top} width="28" height={862 - top} fill="url(#ps-silo)" />
            <ellipse cx={x + 14} cy={top} rx="14" ry="5.5" fill="#F6F9FC" />
            <rect x={x} y={top + 34} width="28" height="2.6" fill="#B2C0CD" opacity="0.6" />
            <rect x={x} y={top + 70} width="28" height="2.6" fill="#B2C0CD" opacity="0.6" />
          </g>
        );
      })}
      <rect x="190" y="742" width="172" height="6" rx="3" fill="#A6B5C3" />
      <rect x="272" y="722" width="4" height="22" fill="#A6B5C3" />

      {/* main processing hall */}
      <rect x="374" y="788" width="262" height="74" fill="url(#ps-block)" />
      <path d="M366 788 L505 762 L644 788 Z" fill="url(#ps-roof)" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={390 + i * 24.6} y="804" width="15" height="26" fill="#89A0B6" opacity="0.5" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={`b${i}`} x={390 + i * 24.6} y="838" width="15" height="14" fill="#89A0B6" opacity="0.32" />
      ))}

      {/* tank and stack behind the hall */}
      <rect x="552" y="742" width="16" height="46" fill="#D6DEE6" />
      <rect x="549" y="737" width="22" height="6" rx="3" fill="#AEBDCA" />
      <rect x="596" y="756" width="38" height="32" rx="6" fill="#E5ECF2" />

      {/* right-hand sheds */}
      <rect x="652" y="810" width="114" height="52" fill="url(#ps-block)" />
      <path d="M646 810 L709 790 L772 810 Z" fill="url(#ps-roof)" />
      <rect x="780" y="764" width="13" height="98" fill="#D9E1E8" />
      <rect x="777" y="759" width="19" height="6" rx="3" fill="#AEBDCA" />

      {/* trees among the buildings */}
      {[
        [168, 852, 17],
        [354, 850, 14],
        [640, 854, 16],
        [776, 852, 13],
        [98, 856, 13],
      ].map(([cx, cy, r]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r} fill="#3E6B2D" opacity="0.85" />
          <circle cx={cx - r * 0.5} cy={cy + r * 0.3} r={r * 0.7} fill="#487935" opacity="0.85" />
        </g>
      ))}
      </g>

      {/* treeline */}
      {Array.from({ length: 36 }, (_, i) => (
        <circle
          key={i}
          cx={4 + i * 24}
          cy={852}
          r={12 + ((i * 7) % 7)}
          fill="#33591F"
          opacity="0.92"
        />
      ))}
      <rect x="0" y="850" width="820" height="20" fill="#33591F" opacity="0.82" />

      {/* fields */}
      <rect x="0" y="862" width="820" height="138" fill="url(#ps-field)" />
      {Array.from({ length: 10 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${878 + i * 14} Q 410 ${868 + i * 14} 820 ${886 + i * 14}`}
          stroke="#93BC6B"
          strokeWidth="2.6"
          fill="none"
          opacity="0.28"
        />
      ))}
    </svg>
  );
}
