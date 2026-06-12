// AVAULT wordmark: heavy geometric caps; A and V as mirrored triangles (spec 1.1).
// Kerning (editor-tuned 2026-06-12): A 5 V 5 A 10 U(50) 16 L → T tucked 2 closer.
// Detail cuts: A apex 8px / V vertex 6px flats; L bar ends in a rising 45° cut
// that tucks under T's bar; T bar undersides chamfered both ends.
export function Wordmark({ className = "h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 64" className={className} aria-label="AVAULT" role="img">
      <title>AVAULT</title>
      {/* A (0–58) */}
      <path d="M0 60 L25 4 H33 L58 60 H44 L29 22 L14 60 Z" fill="currentColor" />
      <rect x="20" y="42" width="18" height="8" fill="currentColor" />
      {/* V (63–121) */}
      <path d="M63 4 H77 L92 42 L107 4 H121 L95 60 H89 Z" fill="currentColor" />
      {/* A (126–184) */}
      <path d="M126 60 L151 4 H159 L184 60 H170 L155 22 L140 60 Z" fill="currentColor" />
      <rect x="146" y="42" width="18" height="8" fill="currentColor" />
      {/* U — width 50 (194–244) */}
      <path d="M194 4 H207 V40 Q207 50 219 50 Q231 50 231 40 V4 H244 V41 Q244 62 219 62 Q194 62 194 41 Z" fill="currentColor" />
      {/* L — rising diagonal bar cut (260–302) */}
      <path d="M260 4 H273 V49 H292 L302 60 H260 Z" fill="currentColor" />
      {/* T — chamfered bar, pulled toward L (304–360) */}
      <path d="M304 4 H360 L350 15 H338 V60 H325 V15 H314 Z" fill="currentColor" />
    </svg>
  );
}
