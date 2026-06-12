// AVAULT wordmark: heavy geometric caps; A and V as mirrored triangles (spec 1.1).
// Architectural optical kerning — gaps graded by the shapes that face each other:
//   diagonal|diagonal (A·V·A) = 6  — triangles carry their own white space
//   diagonal|vertical (A·U)   = 10
//   vertical|vertical (U·L)   = 16 — two full-height stems need the most air
//   stem|overhanging bar (L·T)= 12 — T's bar floats over L's open corner
export function Wordmark({ className = "h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 364 64" className={className} aria-label="AVAULT" role="img">
      <title>AVAULT</title>
      {/* A — triangle with floating crossbar (0–58) */}
      <path d="M0 60 L24 4 H34 L58 60 H44 L29 22 L14 60 Z" fill="currentColor" />
      <rect x="20" y="42" width="18" height="8" fill="currentColor" />
      {/* V — mirrored triangle (64–122) */}
      <path d="M64 4 H78 L93 42 L108 4 H122 L98 60 H88 Z" fill="currentColor" />
      {/* A (128–186) */}
      <path d="M128 60 L152 4 H162 L186 60 H172 L157 22 L142 60 Z" fill="currentColor" />
      <rect x="148" y="42" width="18" height="8" fill="currentColor" />
      {/* U (196–242) */}
      <path d="M196 4 H209 V40 Q209 50 219 50 Q229 50 229 40 V4 H242 V41 Q242 62 219 62 Q196 62 196 41 Z" fill="currentColor" />
      {/* L (258–296) */}
      <path d="M258 4 H271 V49 H296 V60 H258 Z" fill="currentColor" />
      {/* T (308–364) */}
      <path d="M308 4 H364 V15 H342 V60 H329 V15 H308 Z" fill="currentColor" />
    </svg>
  );
}
