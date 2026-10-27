import { cn } from "@/lib/utils";

/** Route mark: two stops joined by a travelled arc, drawn on signal amber. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("h-8 w-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-sunset" />
      <path d="M9 22.5C9 14 23 18 23 9.5" fill="none" strokeWidth="2.6" strokeLinecap="round" className="stroke-navy" strokeDasharray="0.1 4.4" />
      <circle cx="9" cy="22.5" r="3.2" className="fill-navy" />
      <circle cx="23" cy="9.5" r="3.2" className="fill-none stroke-navy" strokeWidth="2.4" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-display text-[1.15rem] font-bold tracking-tight", className)}>
      <BrandMark />
      WanderSync
    </span>
  );
}
