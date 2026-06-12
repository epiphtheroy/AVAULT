// AVAULT wordmark: heavy geometric caps; A and V as mirrored triangles (spec 1.1).
// Architectural kerning + detail cuts:
//   gaps graded by facing strokes — diag|diag 6, diag|vert 10, vert|vert 16
//   L slides toward T, its bar ending in a rising 45° cut that tucks under T's bar
//   T's bar undersides are chamfered at both ends, echoing the A/V diagonals
//   A apexes and V vertex sharpened (8px / 6px flats); U widened to 52
export function Wordmark({ className = "h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 366 64" className={className} aria-label="AVAULT" role="img">
      <title>AVAULT</title>
      {/* A — sharpened apex, floating crossbar (0–58) */}
      <path d="M0 60 L25 4 H33 L58 60 H44 L29 22 L14 60 Z" fill="currentColor" />
      <rect x="20" y="42" width="18" height="8" fill="currentColor" />
      {/* V — sharpened vertex (64–122) */}
      <path d="M64 4 H78 L93 42 L108 4 H122 L96 60 H90 Z" fill="currentColor" />
      {/* A (128–186) */}
      <path d="M128 60 L153 4 H161 L186 60 H172 L157 22 L142 60 Z" fill="currentColor" />
      <rect x="148" y="42" width="18" height="8" fill="currentColor" />
      {/* U — widened bowl (196–248) */}
      <path d="M196 4 H209 V40 Q209 50 222 50 Q235 50 235 40 V4 H248 V41 Q248 62 222 62 Q196 62 196 41 Z" fill="currentColor" />
      {/* L — bar ends in a rising diagonal cut toward T (264–306) */}
      <path d="M264 4 H277 V49 H296 L306 60 H264 Z" fill="currentColor" />
      {/* T — chamfered bar undersides (310–366) */}
      <path d="M310 4 H366 L356 15 H344 V60 H331 V15 H320 Z" fill="currentColor" />
    </svg>
  );
}
