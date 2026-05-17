export function EcgBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
         viewBox="0 0 1200 400" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ecg-grad" x1="0" x2="1">
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0" />
          <stop offset=".5" stopColor="var(--primary)" stopOpacity=".8" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 200 L200 200 L240 200 L260 120 L280 280 L300 60 L320 300 L340 160 L380 200 L600 200 L640 200 L660 140 L680 260 L700 80 L720 290 L740 170 L780 200 L1200 200"
        stroke="url(#ecg-grad)" strokeWidth="2" fill="none"
        style={{ strokeDasharray: 1000, animation: "ecg-dash 6s linear infinite" }}
      />
    </svg>
  );
}
