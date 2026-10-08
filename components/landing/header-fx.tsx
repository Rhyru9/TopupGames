const wires = [
  "M-40 70 C 220 180, 420 40, 720 130 S 1140 50, 1480 160",
  "M-60 150 C 260 60, 540 240, 820 120 S 1200 260, 1500 140",
];

export function HeaderFx() {
  return (
    <div
      className="header-fx pointer-events-none absolute inset-x-0 top-0 z-[2] h-[min(52vh,22rem)]"
      aria-hidden
    >
      <div className="header-fx-glow" />
      <div className="header-fx-core" />

      <svg className="header-fx-svg" viewBox="0 0 1440 360" preserveAspectRatio="none">
        <defs>
          <linearGradient id="header-fx-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff7a1a" stopOpacity="0" />
            <stop offset="42%" stopColor="#ff7a1a" stopOpacity="1" />
            <stop offset="58%" stopColor="#ffd4a8" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff7a1a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {wires.map((d) => (
          <path key={d} className="header-fx-wire" d={d} />
        ))}
        <path className="header-fx-pulse" d={wires[0]} />
      </svg>
    </div>
  );
}
