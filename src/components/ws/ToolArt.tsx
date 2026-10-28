/**
 * One small illustration per tool in Tools, drawn in the same style as the landing-page journey
 * art. Colours come from theme tokens; the gentle motion stops with prefers-reduced-motion.
 */
export type ToolArtName = "checkin" | "translator" | "esim" | "visa" | "compass" | "maps";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full overflow-visible" aria-hidden>
      <circle cx="96" cy="62" r="50" className="fill-primary/10" />
      <circle cx="30" cy="22" r="3" className="art-twinkle fill-primary/40" />
      <circle cx="148" cy="100" r="2.5" className="art-twinkle fill-primary/40" style={{ animationDelay: "1.2s" }} />
      {children}
    </svg>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="6" r="6" className="fill-card" /><circle cx="9" cy="2" r="8" className="fill-card" /><circle cx="19" cy="6" r="6" className="fill-card" />
      <rect x="0" y="6" width="19" height="6" className="fill-card" />
    </g>
  );
}

function Checkin() {
  return (
    <Frame>
      <g className="art-drift" style={{ animationDuration: "9s" }}><Cloud x={100} y={14} s={0.9} /></g>
      <g className="art-float">
        <rect x="22" y="42" width="112" height="58" rx="9" className="fill-card stroke-navy/15" strokeWidth="1" />
        <path d="M22 51 a9 9 0 0 1 9 -9 h94 a9 9 0 0 1 9 9 v5 h-112z" className="fill-primary" />
        <text x="32" y="53" className="fill-primary-foreground text-[8px] font-bold tracking-widest">BOARDING PASS</text>
        <text x="32" y="74" className="fill-navy text-[15px] font-extrabold">DXB</text>
        <text x="72" y="74" className="fill-navy text-[15px] font-extrabold">LHR</text>
        <path d="M58 69 h8 m-3 -3 l3 3 l-3 3" className="stroke-primary" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <rect x="32" y="82" width="26" height="3" rx="1.5" className="fill-navy/20" /><rect x="32" y="89" width="40" height="3" rx="1.5" className="fill-navy/15" />
        <path d="M106 58 v40" className="stroke-navy/20" strokeWidth="1.2" strokeDasharray="3 3" />
        {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => (r + c) % 2 === 0 && <rect key={`${r}${c}`} x={112 + c * 6} y={64 + r * 7} width="5" height="5" rx="1" className="fill-navy/70" />))}
      </g>
      <g className="art-drift" style={{ animationDuration: "6s" }}>
        <path d="M118 30 l-12 -4 l2 -3 l14 2 l8 -6 q4 -2 5 0 q1 2 -3 5 l-8 6 l1 14 l-3 1 l-4 -12 l-6 4 l0 4 l-2 1 l-2 -6 l-5 -3 z" className="fill-primary" />
      </g>
    </Frame>
  );
}

function Translator() {
  return (
    <Frame>
      <g className="art-float">
        <path d="M22 26 h64 a10 10 0 0 1 10 10 v26 a10 10 0 0 1 -10 10 h-46 l-12 10 v-10 h-6 a10 10 0 0 1 -10 -10 v-26 a10 10 0 0 1 10 -10z" className="fill-primary" />
        <text x="54" y="58" textAnchor="middle" className="fill-primary-foreground text-[24px] font-extrabold">Hello</text>
      </g>
      <g className="art-float" style={{ animationDelay: "1.4s" }}>
        <path d="M74 56 h60 a10 10 0 0 1 10 10 v24 a10 10 0 0 1 -10 10 h-6 v10 l-12 -10 h-42 a10 10 0 0 1 -10 -10 v-24 a10 10 0 0 1 10 -10z" className="fill-card stroke-navy/15" strokeWidth="1" />
        <text x="104" y="87" textAnchor="middle" className="fill-navy text-[22px] font-extrabold">مرحبا</text>
      </g>
      <g className="fill-primary/60">
        <circle cx="62" cy="96" r="2.5" className="art-twinkle" /><circle cx="54" cy="102" r="2" className="art-twinkle" style={{ animationDelay: ".6s" }} />
      </g>
    </Frame>
  );
}

function Esim() {
  return (
    <Frame>
      <circle cx="44" cy="56" r="26" className="fill-card stroke-primary/40" strokeWidth="1.5" />
      <path d="M18 56 h52 M44 30 v52 M24 42 q20 6 40 0 M24 70 q20 -6 40 0" className="stroke-primary/40" strokeWidth="1.2" fill="none" />
      <path d="M44 30 q-14 26 0 52 M44 30 q14 26 0 52" className="stroke-primary/40" strokeWidth="1.2" fill="none" />
      <g className="art-float">
        <rect x="76" y="16" width="52" height="94" rx="10" className="fill-navy" />
        <rect x="81" y="24" width="42" height="76" rx="5" className="fill-card" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={89 + i * 7} y={52 - i * 6} width="5" height={10 + i * 6} rx="1.5" className={i < 3 ? "fill-primary" : "fill-primary/30"} />)}
        <text x="102" y="80" textAnchor="middle" className="fill-navy text-[10px] font-extrabold">5G</text>
        <rect x="95" y="104" width="14" height="2.5" rx="1.25" className="fill-card/40" />
      </g>
      <g className="art-bob" style={{ animationDuration: "4s" }}>
        <path d="M112 72 h22 l8 8 v26 a3 3 0 0 1 -3 3 h-27 a3 3 0 0 1 -3 -3 v-31 a3 3 0 0 1 3 -3z" className="fill-primary stroke-card" strokeWidth="2" />
        <rect x="117" y="84" width="18" height="16" rx="2.5" className="fill-card/85" />
        <path d="M117 92 h18 M126 84 v16" className="stroke-primary/60" strokeWidth="1.2" />
      </g>
    </Frame>
  );
}

function Visa() {
  return (
    <Frame>
      <g className="art-float">
        <rect x="34" y="18" width="62" height="88" rx="7" className="fill-navy" />
        <rect x="38" y="18" width="3" height="88" className="fill-navy-foreground/10" />
        <circle cx="66" cy="54" r="15" className="stroke-navy-foreground/70" strokeWidth="2" fill="none" />
        <path d="M51 54 h30 M66 39 q-8 15 0 30 M66 39 q8 15 0 30" className="stroke-navy-foreground/70" strokeWidth="1.4" fill="none" />
        <text x="66" y="88" textAnchor="middle" className="fill-navy-foreground text-[7px] font-bold tracking-[0.15em]">PASSPORT</text>
      </g>
      <g className="art-stamp" transform="rotate(-14 116 72)">
        <circle cx="116" cy="72" r="26" className="fill-card stroke-primary" strokeWidth="3" />
        <circle cx="116" cy="72" r="20" className="stroke-primary/50" strokeWidth="1.2" fill="none" strokeDasharray="2.5 2.5" />
        <text x="116" y="70" textAnchor="middle" className="fill-primary text-[13px] font-extrabold tracking-wider">VISA</text>
        <path d="M106 77 l6 6 l12 -12" className="stroke-primary" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Frame>
  );
}

function CompassArt() {
  return (
    <Frame>
      <g className="art-float">
        <circle cx="80" cy="60" r="44" className="fill-navy" />
        <circle cx="80" cy="60" r="37" className="fill-card" />
        {Array.from({ length: 24 }, (_, i) => <path key={i} d="M80 25 v5" transform={`rotate(${i * 15} 80 60)`} className={i % 6 === 0 ? "stroke-navy" : "stroke-navy/30"} strokeWidth={i % 6 === 0 ? 2.2 : 1.2} strokeLinecap="round" />)}
        <text x="80" y="42" textAnchor="middle" className="fill-destructive text-[10px] font-extrabold">N</text>
        <text x="80" y="87" textAnchor="middle" className="fill-navy/60 text-[9px] font-bold">S</text>
        <text x="106" y="63" textAnchor="middle" className="fill-navy/60 text-[9px] font-bold">E</text>
        <text x="54" y="63" textAnchor="middle" className="fill-navy/60 text-[9px] font-bold">W</text>
        <g className="art-sway">
          <path d="M80 34 l7 26 h-14z" className="fill-destructive" />
          <path d="M80 86 l7 -26 h-14z" className="fill-navy/50" />
          <circle cx="80" cy="60" r="3.5" className="fill-navy" />
        </g>
      </g>
    </Frame>
  );
}

function Maps() {
  return (
    <Frame>
      <g className="art-float">
        <path d="M24 36 l36 -10 l40 10 l36 -10 v70 l-36 10 l-40 -10 l-36 10z" className="fill-card stroke-navy/15" strokeWidth="1" />
        <path d="M60 26 v70 l40 10 v-70z" className="fill-primary/10" />
        <path d="M30 88 q20 -8 30 -20 t40 -10 q14 0 22 -14" className="art-road stroke-primary" strokeWidth="2.5" fill="none" strokeDasharray="6 3" strokeLinecap="round" />
        <circle cx="30" cy="88" r="4" className="fill-navy" />
      </g>
      <g className="art-pin">
        <path d="M122 46 c0 -12 -9 -20 -18 -20 s-18 8 -18 20 c0 13 18 30 18 30 s18 -17 18 -30z" className="fill-primary stroke-card" strokeWidth="2" />
        <circle cx="104" cy="45" r="6.5" className="fill-card" />
      </g>
    </Frame>
  );
}

const ART: Record<ToolArtName, () => React.JSX.Element> = { checkin: Checkin, translator: Translator, esim: Esim, visa: Visa, compass: CompassArt, maps: Maps };

export function ToolArt({ name, className }: { name: ToolArtName; className?: string }) {
  const Art = ART[name];
  return <div className={className}><Art /></div>;
}
