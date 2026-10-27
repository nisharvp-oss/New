import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./motion";

const ALPHABET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-";
const STEP_MS = 38;

/**
 * One split-flap cell. Like a real board it steps through the alphabet until it
 * reaches its target, so short hops settle quickly and long ones keep turning.
 */
function FlapCell({ target, delay }: { target: string; delay: number }) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(" ");
  const [tick, setTick] = useState(0);
  const shownRef = useRef(" ");

  useEffect(() => {
    if (reduced) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const goal = ALPHABET.includes(target) ? target : " ";
    const step = () => {
      const cur = ALPHABET.indexOf(shownRef.current);
      if (ALPHABET[cur] === goal) return;
      const next = ALPHABET[(cur + 1) % ALPHABET.length]!;
      shownRef.current = next;
      setShown(next);
      setTick((t) => t + 1);
      timer = setTimeout(step, STEP_MS);
    };
    timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [target, delay, reduced]);

  return (
    <span className="flap-cell" aria-hidden>
      <span key={tick} className={cn("flap-face", tick > 0 && "flap-turn")}>{shown === " " ? " " : shown}</span>
    </span>
  );
}

export function SplitFlap({ text, length, delay = 0, className }: { text: string; length: number; delay?: number; className?: string }) {
  const padded = text.toUpperCase().padEnd(length, " ").slice(0, length);
  return (
    <span className={cn("inline-flex gap-[2px]", className)} role="text" aria-label={text}>
      {padded.split("").map((ch, i) => (
        <FlapCell key={i} target={ch} delay={delay + i * 45} />
      ))}
    </span>
  );
}
