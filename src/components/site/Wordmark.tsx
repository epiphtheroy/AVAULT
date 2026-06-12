// AVAULT wordmark: heavy geometric caps; A and V as mirrored triangles (spec 1.1).
// Optical kerning: diagonal pairs (A·V·A) sit numerically tighter (8) than the
// straight-sided U·L·T (12) so the perceived rhythm is even.
export function Wordmark({ className = "h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 366 64" className={className} aria-label="AVAULT" role="img">
      <title>AVAULT</title>
      {/* A — triangle with floating crossbar */}
      <path d="M0 60 L24 4 H34 L58 60 H44 L29 22 L14 60 Z" fill="currentColor" />
      <rect x="20" y="42" width="18" height="8" fill="currentColor" />
      {/* V — mirrored triangle */}
      <path d="M66 4 H80 L95 42 L110 4 H124 L100 60 H90 Z" fill="currentColor" />
      {/* A */}
      <path d="M132 60 L156 4 H166 L190 60 H176 L161 22 L146 60 Z" fill="currentColor" />
      <rect x="152" y="42" width="18" height="8" fill="currentColor" />
      {/* U */}
      <path d="M202 4 H215 V40 Q215 50 225 50 Q235 50 235 40 V4 H248 V41 Q248 62 225 62 Q202 62 202 41 Z" fill="currentColor" />
      {/* L */}
      <path d="M260 4 H273 V49 H298 V60 H260 Z" fill="currentColor" />
      {/* T */}
      <path d="M310 4 H366 V15 H344 V60 H331 V15 H310 Z" fill="currentColor" />
    </svg>
  );
}
