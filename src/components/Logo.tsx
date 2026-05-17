import { Link } from "@tanstack/react-router";

type Props = { compact?: boolean; animateIntro?: boolean; className?: string };

export function Logo({ compact = false, animateIntro = false, className = "" }: Props) {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 group ${className}`}>
      <svg viewBox="0 0 64 56" width={compact ? 32 : 40} height={compact ? 28 : 36} className="shrink-0">
        {/* heart outline */}
        <path
          d="M32 50 C 6 34, 4 14, 18 8 C 26 5, 30 12, 32 16 C 34 12, 38 5, 46 8 C 60 14, 58 34, 32 50 Z"
          fill="none" stroke="currentColor" strokeWidth="2.2"
          className={`text-foreground ${animateIntro ? "logo-draw" : ""}`}
        />
        {/* circuit traces */}
        <g stroke="var(--primary)" strokeWidth="1" fill="none" opacity=".75"
           className={animateIntro ? "logo-draw" : ""}>
          <path d="M14 22 L20 22 L24 26" />
          <path d="M50 22 L44 22 L40 26" />
          <path d="M14 34 L22 34" />
          <path d="M50 34 L42 34" />
          <circle cx="13" cy="22" r="1.3" fill="var(--primary)" />
          <circle cx="51" cy="22" r="1.3" fill="var(--primary)" />
          <circle cx="13" cy="34" r="1.3" fill="var(--primary)" />
          <circle cx="51" cy="34" r="1.3" fill="var(--primary)" />
        </g>
        {/* DNA helix (simplified) */}
        <g stroke="var(--primary)" strokeWidth="1.4" fill="none" className={animateIntro ? "logo-fade" : ""}>
          <path d="M28 14 Q 32 22, 36 30 Q 32 38, 28 46" opacity=".9" />
          <path d="M36 14 Q 32 22, 28 30 Q 32 38, 36 46" opacity=".9" />
          <line x1="29" y1="18" x2="35" y2="18" />
          <line x1="35" y1="26" x2="29" y2="26" />
          <line x1="29" y1="34" x2="35" y2="34" />
          <line x1="35" y1="42" x2="29" y2="42" />
        </g>
        {/* ECG pulse line */}
        <g>
          <path id="ecg-path" d="M6 30 L20 30 L24 22 L28 38 L32 18 L36 38 L40 26 L44 30 L58 30"
            stroke="var(--primary)" strokeWidth="1.8" fill="none"
            style={{ filter: "drop-shadow(0 0 4px var(--primary))" }} />
          <circle r="2.2" className="ecg-pulse-dot"
            style={{ offsetPath: "path('M6 30 L20 30 L24 22 L28 38 L32 18 L36 38 L40 26 L44 30 L58 30')" }} />
        </g>
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="font-display font-bold text-xl tracking-tight">MedElectra</div>
          <div className="text-xs font-light text-muted-foreground tracking-widest uppercase">Institute</div>
        </div>
      )}
    </Link>
  );
}
