/** The ANUMATI mark: a navy "A" with a green leaf cut into its counter. */
export function AnumatiMark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden>
      <defs>
        <linearGradient id="am-blue" x1="8" y1="4" x2="46" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2B5B8C" />
          <stop offset="1" stopColor="#15365B" />
        </linearGradient>
        <linearGradient id="am-green" x1="24" y1="26" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7DC242" />
          <stop offset="1" stopColor="#3E9B4F" />
        </linearGradient>
      </defs>
      <path
        d="M23.9 6.4a4.6 4.6 0 0 1 8.2 0l18.6 38.9a4.6 4.6 0 0 1-4.1 6.6h-6.9a3 3 0 0 1-2.7-1.7L28 25.7 19 50.2a3 3 0 0 1-2.8 1.7H9.4a4.6 4.6 0 0 1-4.1-6.6Z"
        fill="url(#am-blue)"
      />
      <path
        d="M27.4 28.6c6.4 1.5 10.4 5.8 11.4 12.6-6.5-1.2-10.4-5.4-11.4-12.6Z"
        fill="url(#am-green)"
      />
      <circle cx="34.8" cy="16.6" r="3" fill="#8CCB4C" />
    </svg>
  );
}
