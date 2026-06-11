// AVAULT wordmark: heavy geometric caps; A and V as mirrored triangles (spec 1.1).
export function Wordmark({ className = "h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 64" className={className} aria-label="AVAULT" role="img">
      <title>AVAULT</title>
      {/* A — triangle with floating crossbar */}
      <path d="M2 60 L26 4 H36 L60 60 H46 L31 22 L16 60 Z" fill="currentColor" />
      <rect x="22" y="42" width="18" height="8" fill="currentColor" />
      {/* V — mirrored triangle */}
      <path d="M64 4 H78 L93 42 L108 4 H122 L98 60 H88 Z" fill="currentColor" />
      {/* A */}
      <path d="M124 60 L148 4 H158 L182 60 H168 L153 22 L138 60 Z" fill="currentColor" />
      <rect x="144" y="42" width="18" height="8" fill="currentColor" />
      {/* U */}
      <path d="M188 4 H201 V40 Q201 50 211 50 Q221 50 221 40 V4 H234 V41 Q234 62 211 62 Q188 62 188 41 Z" fill="currentColor" />
      {/* L */}
      <path d="M242 4 H255 V49 H280 V60 H242 Z" fill="currentColor" />
      {/* T */}
      <path d="M282 4 H338 V15 H316 V60 H303 V15 H282 Z" fill="currentColor" />
    </svg>
  );
}
