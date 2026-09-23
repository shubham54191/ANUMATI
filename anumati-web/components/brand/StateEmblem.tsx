/**
 * A government seal placeholder — the Ashoka Chakra, drawn plainly.
 *
 * The State Emblem of India is protected under the State Emblem of India
 * (Prohibition of Improper Use) Act, 2005, and this is a prototype, so the
 * real emblem is not reproduced here. Drop the official asset in when the
 * project is cleared to carry it; nothing else on the page changes.
 */
export function StateEmblem({ size = 46 }: { size?: number }) {
  const spokes = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Government of India">
      <circle cx="24" cy="24" r="21" stroke="#15365B" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="17" stroke="#15365B" strokeWidth="1.1" />
      {spokes.map((deg) => (
        <line
          key={deg}
          x1="24"
          y1="7.8"
          x2="24"
          y2="40.2"
          stroke="#15365B"
          strokeWidth="0.85"
          transform={`rotate(${deg} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="3.4" fill="#15365B" />
    </svg>
  );
}
