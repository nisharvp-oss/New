/**
 * Illustrations for the landing page route: one vehicle per leg (drawn facing right; journey.ts
 * flips and tilts it along the path) and a small scene that appears beside each leg while its
 * vehicle is travelling. Colours come from theme tokens so the art follows the palette.
 */

export function Plane() {
  return (
    <svg viewBox="0 0 120 64" className="h-full w-full overflow-visible">
      <g className="art-trail">
        <circle cx="4" cy="33" r="5" className="fill-card" />
        <circle cx="-8" cy="31" r="3.5" className="fill-card" />
        <circle cx="-17" cy="34" r="2.5" className="fill-card" />
      </g>
      <path d="M20 27 L11 9 L23 9 L36 27Z" className="fill-primary" />
      <path d="M16 33 L5 39 L19 39 L28 34Z" className="fill-primary/80" />
      <path d="M12 29 Q14 24 26 24 L96 24 Q113 24 118 32 Q113 40 96 40 L26 40 Q14 40 12 35Z" className="fill-card stroke-navy/15" strokeWidth="1" />
      <path d="M16 36 L114 36" className="stroke-primary" strokeWidth="2.6" />
      {[32, 40, 48, 56, 64, 72, 80, 88].map((x) => <circle key={x} cx={x} cy="30" r="1.7" className="fill-navy/60" />)}
      <path d="M103 27.5 Q110 27.5 114 31 L103 31Z" className="fill-navy/80" />
      <path d="M60 37 L44 56 L57 56 L80 38Z" className="fill-primary" />
      <rect x="49" y="42" width="17" height="7" rx="3.5" className="fill-navy/80" />
    </svg>
  );
}

export function Ferry() {
  return (
    <svg viewBox="0 0 120 64" className="h-full w-full overflow-visible">
      <g className="art-bob">
        <rect x="80" y="8" width="9" height="13" rx="1.5" className="fill-primary" />
        <rect x="80" y="11" width="9" height="2.5" className="fill-card" />
        <rect x="34" y="17" width="46" height="10" rx="2" className="fill-card stroke-navy/15" strokeWidth="1" />
        <rect x="24" y="26" width="70" height="13" rx="2" className="fill-card stroke-navy/15" strokeWidth="1" />
        {[39, 47, 55, 63, 71].map((x) => <rect key={x} x={x} y="20" width="5" height="3.5" rx="1" className="fill-primary/70" />)}
        {[29, 37, 45, 53, 61, 69, 77, 85].map((x) => <circle key={x} cx={x} cy="32.5" r="1.8" className="fill-navy/60" />)}
        <path d="M6 38 L114 38 L103 53 L17 53Z" className="fill-navy" />
        <path d="M10 43 L110 43" className="stroke-primary" strokeWidth="2.6" />
      </g>
      <path className="art-wave stroke-primary/45" d="M-10 57 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Train() {
  return (
    <svg viewBox="0 0 120 64" className="h-full w-full overflow-visible">
      <g className="art-speed stroke-primary/40" strokeWidth="2" strokeLinecap="round">
        <path d="M-14 26 L-2 26" /><path d="M-22 33 L-4 33" /><path d="M-12 40 L-2 40" />
      </g>
      <path d="M2 53 L120 53" className="stroke-navy/35" strokeWidth="2" />
      {[8, 22, 36, 50, 64, 78, 92, 106].map((x) => <path key={x} d={`M${x} 53 L${x + 6} 57`} className="stroke-navy/25" strokeWidth="2" />)}
      <g className="art-rumble">
        <path d="M4 22 L82 22 Q108 22 117 40 L117 44 L4 44Z" className="fill-card stroke-navy/15" strokeWidth="1" />
        <path d="M8 27 L84 27 Q99 27 106 35 L8 35Z" className="fill-navy/85" />
        {[22, 38, 54, 70].map((x) => <path key={x} d={`M${x} 27 L${x} 35`} className="stroke-card" strokeWidth="1.5" />)}
        <rect x="4" y="38" width="113" height="3" className="fill-primary" />
        <rect x="6" y="44" width="106" height="4" rx="2" className="fill-navy/70" />
        {[16, 28, 84, 96].map((x) => <circle key={x} cx={x} cy="49" r="3" className="fill-navy" />)}
      </g>
    </svg>
  );
}

export function Car() {
  return (
    <svg viewBox="0 0 120 64" className="h-full w-full overflow-visible">
      <path className="art-road stroke-navy/30" d="M-10 56 L130 56" strokeWidth="2" strokeDasharray="10 8" />
      <g className="art-bounce">
        <path d="M16 41 Q16 33 27 32 L40 31 L52 21 Q55 18 61 18 L80 18 Q86 18 90 22 L99 31 Q111 32 113 39 L113 45 Q113 47 111 47 L18 47 Q16 47 16 45Z" className="fill-primary" />
        <path d="M45 31 L55 22.5 Q57 21 60 21 L68 21 L68 31Z" className="fill-card/90" />
        <path d="M71 31 L71 21 L80 21 Q84 21 87 24 L94 31Z" className="fill-card/90" />
        <rect x="106" y="35" width="6" height="3.5" rx="1.5" className="fill-sunset" />
        <rect x="16" y="36" width="5" height="3" rx="1.5" className="fill-destructive/80" />
        {[38, 94].map((x) => (
          <g key={x}>
            <circle cx={x} cy="47" r="7.5" className="fill-navy" />
            <circle cx={x} cy="47" r="3" className="fill-card" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ---------- Scenes (360 x 170), shown beside a leg only while its vehicle travels ---------- */

function Cloud({ x, y, s = 1, className }: { x: number; y: number; s?: number; className?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className={className}>
      <path d="M8 34 Q0 34 0 26 Q0 18 9 18 Q11 6 25 6 Q36 6 40 15 Q44 10 51 12 Q60 14 60 24 Q66 25 66 30 Q66 34 60 34Z" className="fill-accent stroke-primary/15" strokeWidth="1.2" />
      <path d="M12 18 Q14 10 25 10 Q33 10 36 17" className="fill-none stroke-card" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

export function SkyScene() {
  return (
    <svg viewBox="0 0 360 170" className="h-full w-full overflow-visible">
      <g className="art-drift" style={{ animationDuration: "14s" }}><Cloud x={10} y={18} s={1.25} /></g>
      <g className="art-drift" style={{ animationDuration: "18s", animationDelay: "-6s" }}><Cloud x={220} y={4} s={0.9} /></g>
      <g className="art-drift" style={{ animationDuration: "11s", animationDelay: "-3s" }}><Cloud x={150} y={104} s={0.75} /></g>
      <g className="art-flap stroke-navy/40" fill="none" strokeWidth="2" strokeLinecap="round">
        <path d="M268 82 q5 -5 10 0 q5 -5 10 0" />
        <path d="M292 96 q4 -4 8 0 q4 -4 8 0" />
      </g>
    </svg>
  );
}

const DOLPHIN = "M0 16 Q9 3 26 5 Q36 6 43 13 Q37 13 34 15 Q30 13 25 14 L22 20 L19 14 Q10 15 0 16Z M20 6 L25 0 L28 6Z";

export function SeaScene() {
  return (
    <svg viewBox="0 0 360 170" className="h-full w-full overflow-visible">
      {[118, 136, 152].map((y, i) => (
        <path key={y} className="art-wave stroke-primary" style={{ opacity: 0.35 - i * 0.08, animationDuration: `${3 + i}s`, ["--wave" as string]: "-40px" }}
          d={`M-20 ${y} q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0`}
          fill="none" strokeWidth="3" strokeLinecap="round" />
      ))}
      <g className="art-jump" style={{ transformOrigin: "110px 120px" }}>
        <path d={DOLPHIN} transform="translate(90 92)" className="fill-primary/80" />
      </g>
      <g className="art-jump" style={{ transformOrigin: "250px 125px", animationDelay: "-1.3s" }}>
        <path d={DOLPHIN} transform="translate(232 98) scale(0.8)" className="fill-primary/60" />
      </g>
      <g className="art-splash fill-primary/40">
        <circle cx="96" cy="114" r="2.5" /><circle cx="104" cy="110" r="2" /><circle cx="140" cy="112" r="2.5" />
      </g>
    </svg>
  );
}

export function MountainScene() {
  return (
    <svg viewBox="0 0 360 170" className="h-full w-full overflow-visible">
      <circle cx="292" cy="38" r="16" className="fill-sunset/50" />
      <path d="M0 150 L70 62 L118 110 L176 34 L250 120 L300 78 L360 150Z" className="fill-primary/15" />
      <path d="M152 64 L176 34 L198 60 L186 56 L176 64 L164 56Z M56 80 L70 62 L84 76 L74 74 L68 80Z" className="fill-card" />
      <path d="M0 150 L40 112 L96 138 L150 96 L214 140 L280 108 L360 150Z" className="fill-primary/25" />
      {[[34, 150, 1], [58, 152, 0.8], [250, 152, 1.1], [278, 150, 0.85], [306, 152, 1]].map(([x, y, s]) => (
        <path key={x} d="M0 0 L-9 -20 L-4 -20 L-11 -34 L-5 -34 L0 -46 L5 -34 L11 -34 L4 -20 L9 -20Z" transform={`translate(${x} ${y}) scale(${s})`} className="fill-success/70" />
      ))}
    </svg>
  );
}

export function CityScene() {
  const towers: [number, number, number][] = [[18, 70, 26], [48, 96, 22], [74, 58, 30], [108, 120, 18], [130, 80, 28], [214, 66, 26], [244, 104, 20], [268, 76, 30], [302, 50, 24], [330, 88, 22]];
  return (
    <svg viewBox="0 0 360 170" className="h-full w-full overflow-visible">
      {towers.map(([x, h, w], i) => (
        <g key={x}>
          <rect x={x} y={160 - h} width={w} height={h} rx="2" className={i % 2 ? "fill-primary/20" : "fill-navy/12"} />
          {[0, 1, 2].map((r) => <rect key={r} x={x + 5} y={160 - h + 10 + r * 16} width="4" height="4" rx="1" className="art-twinkle fill-sunset/70" style={{ animationDelay: `${(i * 3 + r) * 0.37}s` }} />)}
        </g>
      ))}
      <path d="M176 160 L176 52 L180 30 L184 52 L184 160Z M170 160 L170 84 L190 84 L190 160Z" className="fill-primary/30" />
      {[150, 202].map((x) => (
        <g key={x} transform={`translate(${x} 160)`}>
          <path d="M0 0 Q3 -24 1 -46" className="fill-none stroke-navy/40" strokeWidth="3" strokeLinecap="round" />
          <path d="M1 -46 Q-14 -50 -20 -40 Q-10 -46 1 -44 Q14 -54 22 -42 Q12 -46 1 -44 Q-4 -60 -14 -60 Q-4 -54 1 -46 Q8 -62 18 -58 Q8 -54 1 -46Z" className="fill-success/70" />
        </g>
      ))}
      <path d="M0 160 L360 160" className="stroke-navy/20" strokeWidth="2" />
    </svg>
  );
}

/* ---------- Mini scenes (64 x 44) that ride behind each vehicle on the narrow timeline ---------- */

export function MiniSky() {
  return (
    <svg viewBox="0 0 64 44" className="h-full w-full overflow-visible">
      <g className="art-drift" style={{ animationDuration: "5s" }}><Cloud x={2} y={2} s={0.62} /></g>
      <path className="art-flap stroke-navy/40" d="M44 8 q3 -3 6 0 q3 -3 6 0" fill="none" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MiniSea() {
  return (
    <svg viewBox="0 0 64 44" className="h-full w-full overflow-visible">
      <g className="art-jump" style={{ transformOrigin: "26px 34px", animationDuration: "2.4s" }}>
        <path d={DOLPHIN} transform="translate(14 14) scale(0.55)" className="fill-primary/80" />
      </g>
      <path className="art-wave stroke-primary/45" style={{ ["--wave" as string]: "-16px" }} d="M-8 40 q4 -4 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0" fill="none" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function MiniPeaks() {
  return (
    <svg viewBox="0 0 64 44" className="h-full w-full overflow-visible">
      <path d="M0 44 L22 12 L34 28 L44 16 L64 44Z" className="fill-primary/20" />
      <path d="M17 19 L22 12 L27 19 L24 18 L22 21 L20 18Z" className="fill-card" />
      {[[8, 44, 0.45], [54, 44, 0.5]].map(([x, y, s]) => (
        <path key={x} d="M0 0 L-9 -20 L-4 -20 L-11 -34 L-5 -34 L0 -46 L5 -34 L11 -34 L4 -20 L9 -20Z" transform={`translate(${x} ${y}) scale(${s})`} className="fill-success/70" />
      ))}
    </svg>
  );
}

export function MiniCity() {
  return (
    <svg viewBox="0 0 64 44" className="h-full w-full overflow-visible">
      {([[2, 22, 10], [14, 32, 9], [36, 26, 10], [48, 18, 12]] as const).map(([x, h, w], i) => (
        <g key={x}>
          <rect x={x} y={44 - h} width={w} height={h} rx="1.5" className={i % 2 ? "fill-primary/25" : "fill-navy/15"} />
          <rect x={x + 3} y={44 - h + 5} width="2.5" height="2.5" className="art-twinkle fill-sunset/70" style={{ animationDelay: `${i * 0.7}s` }} />
        </g>
      ))}
      <path d="M27 44 L27 10 L29 2 L31 10 L31 44Z" className="fill-primary/35" />
    </svg>
  );
}
