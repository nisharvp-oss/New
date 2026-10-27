import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Scroll motion for the landing page, driven by data attributes so the markup stays declarative:
 * - data-reveal                 fades and lifts in when it enters the viewport (children of
 *                               data-reveal-group stagger)
 * - data-parallax="0.15"        drifts against the scroll by that fraction of its section
 * - data-hscroll / data-track   pins the section and slides the track sideways (desktop only)
 * - data-expand                 grows from an inset rounded card to full bleed as it scrolls in
 * - data-count="42.5"           counts up from 0 when it enters
 * Everything is skipped when the visitor prefers reduced motion; the static layout is complete.
 */
export function useLandingMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // In-page links glide instead of jumping.
      const onClick = (e: MouseEvent) => {
        const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
        if (!a) return;
        const target = document.querySelector(a.getAttribute("href")!);
        if (target) { e.preventDefault(); lenis.scrollTo(target as HTMLElement, { offset: -72 }); }
      };
      el.addEventListener("click", onClick);

      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((node) => {
          gsap.from(node, {
            y: 40, opacity: 0, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: node, start: "top 88%", once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
          gsap.from(group.children, {
            y: 48, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.09,
            scrollTrigger: { trigger: group, start: "top 85%", once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((node) => {
          const amount = Number(node.dataset["parallax"]) || 0.15;
          const section = node.closest("section") ?? node;
          gsap.to(node, {
            yPercent: amount * 100, ease: "none",
            scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-expand]").forEach((node) => {
          gsap.fromTo(node,
            { clipPath: "inset(10% 6% 10% 6% round 40px)" },
            { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: node, start: "top 90%", end: "top 15%", scrub: true } });
        });
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((node) => {
          const to = Number(node.dataset["count"]);
          const decimals = (node.dataset["count"]!.split(".")[1] ?? "").length;
          const state = { v: 0 };
          gsap.to(state, {
            v: to, duration: 1.6, ease: "power2.out",
            scrollTrigger: { trigger: node, start: "top 85%", once: true },
            onUpdate: () => { node.textContent = state.v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); },
          });
        });

        const mm = gsap.matchMedia();
        mm.add("(min-width: 1024px)", () => {
          gsap.utils.toArray<HTMLElement>("[data-hscroll]").forEach((section) => {
            const track = section.querySelector<HTMLElement>("[data-track]");
            if (!track) return;
            const distance = () => track.scrollWidth - track.clientWidth;
            gsap.to(track, {
              x: () => -distance(), ease: "none",
              scrollTrigger: { trigger: section, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
            });
          });
        });
      }, el);

      cleanup = () => {
        el.removeEventListener("click", onClick);
        ctx.revert();
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    })();

    return () => { cancelled = true; cleanup(); };
  }, [root]);
}

/** Index of the step currently crossing the middle of the viewport. */
export function useActiveStep(count: number): [(i: number) => (node: HTMLElement | null) => void, number] {
  const [active, setActive] = useState(0);
  const nodes = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset["step"])); }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    nodes.current.slice(0, count).forEach((n) => n && io.observe(n));
    return () => io.disconnect();
  }, [count]);
  return [(i) => (node) => { nodes.current[i] = node; }, active];
}
