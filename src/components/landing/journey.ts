/**
 * Geometry for the landing page route: a leg runs from each stop (a phone, or on narrow screens a
 * step row) to the next, and a vehicle rides along it. Positions come from offsetTop/offsetLeft so
 * reveal and parallax transforms never skew the measurements.
 */
type Box = { x: number; y: number; w: number; h: number };
type Leg = { ax: number; ay: number; bx: number; by: number; len: number; base: SVGPathElement; line: SVGPathElement; vehicle: HTMLElement };

function boxWithin(el: HTMLElement, root: HTMLElement): Box {
  let x = 0, y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

const visible = (el: Element | null): el is HTMLElement => !!el && (el as HTMLElement).offsetParent !== null;

export function createJourney(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>("[data-route]");
  const overlay = root.querySelector<HTMLElement>("[data-journey-overlay]");
  if (!svg || !overlay) return null;
  const legEls = [...svg.querySelectorAll<SVGGElement>("[data-leg]")];
  const dots = [...svg.querySelectorAll<SVGCircleElement>("[data-dot]")];
  const vehicles = [...overlay.querySelectorAll<HTMLElement>("[data-vehicle]")];
  let legs: Leg[] = [];

  const stop = (i: number, wide: boolean) => {
    const d = root.querySelector(`[data-stop-d="${i}"]`);
    const m = root.querySelector(`[data-stop-m="${i}"]`);
    return wide && visible(d) ? { el: d, phone: true } : visible(m) ? { el: m, phone: false } : null;
  };

  function layout() {
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    svg!.setAttribute("width", String(root.offsetWidth));
    svg!.setAttribute("height", String(root.offsetHeight));
    legs = [];
    legEls.forEach((g, i) => {
      const from = stop(i, wide), to = stop(i + 1, wide);
      const base = g.querySelector<SVGPathElement>("[data-base]")!;
      const line = g.querySelector<SVGPathElement>("[data-progress]")!;
      if (!from || !to) { base.setAttribute("d", ""); line.setAttribute("d", ""); return; }
      const a = boxWithin(from.el, root), b = boxWithin(to.el, root);
      let d: string, ax: number, ay: number, bx: number, by: number;
      if (from.phone && to.phone) {
        // Out of the bottom of one phone, into the top of the next, as an S-curve.
        ax = a.x + a.w / 2; ay = a.y + a.h + 18;
        bx = b.x + b.w / 2; by = b.y - 18;
        if (i === 0) {
          // From the hero, drop down the empty side first so the sweep passes below the section heading.
          const turn = by - 170;
          d = `M ${ax} ${ay} L ${ax} ${turn} C ${ax} ${by - 40}, ${bx} ${by - 130}, ${bx} ${by}`;
        } else {
          const k = Math.max(90, (by - ay) * 0.6);
          d = `M ${ax} ${ay} C ${ax} ${ay + k}, ${bx} ${by - k}, ${bx} ${by}`;
        }
      } else {
        // Narrow screens: a straight timeline in the left gutter beside each step.
        ax = bx = a.x + 12;
        ay = a.y + (i === 0 ? 12 : 22);
        by = b.y + 22;
        d = `M ${ax} ${ay} L ${bx} ${by}`;
      }
      base.setAttribute("d", d);
      line.setAttribute("d", d);
      const len = base.getTotalLength();
      line.style.strokeDasharray = `${len}`;
      legs[i] = { ax, ay, bx, by, len, base, line, vehicle: vehicles[i]! };
      dots[i]?.setAttribute("cx", String(ax));
      dots[i]?.setAttribute("cy", String(ay));
      dots[i + 1]?.setAttribute("cx", String(bx));
      dots[i + 1]?.setAttribute("cy", String(by));
    });
  }

  /** Draws leg `i` up to `p` (0–1) and parks its vehicle at `at` along it (defaults to `p`). */
  function setProgress(i: number, p: number, at = p) {
    const leg = legs[i];
    if (!leg) return;
    leg.line.style.strokeDashoffset = `${leg.len * (1 - p)}`;
    const pt = leg.base.getPointAtLength(leg.len * Math.min(1, Math.max(0, at)));
    leg.vehicle.style.transform = `translate(${pt.x - 24}px, ${pt.y - 24}px)`;
    leg.vehicle.style.opacity = "1";
  }

  /** Scroll positions where leg `i` starts and finishes: it travels while its path crosses the lower half of the screen. */
  function range(i: number): [number, number] {
    const leg = legs[i];
    if (!leg) return [0, 1];
    const top = root.getBoundingClientRect().top + window.scrollY;
    const vh = window.innerHeight;
    const start = top + leg.ay - vh * 0.8;
    return [start, Math.max(start + 1, top + leg.by - vh * 0.45)];
  }

  return { layout, setProgress, range, count: legEls.length };
}
