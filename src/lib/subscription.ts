// Pure subscription rules; mirrors the database function company_is_writable.
export type CompanyStatus = "trial" | "active" | "suspended";
export type BillingState = { status: CompanyStatus; trial_ends_at: string | null; paid_until: string | null };

export function isWritable(c: BillingState, now: Date = new Date()): boolean {
  if (c.status === "active") return !c.paid_until || new Date(c.paid_until) > now;
  if (c.status === "trial") return !!c.trial_ends_at && new Date(c.trial_ends_at) > now;
  return false;
}

export function trialDaysLeft(c: BillingState, now: Date = new Date()): number {
  if (c.status !== "trial" || !c.trial_ends_at) return 0;
  const ms = new Date(c.trial_ends_at).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function statusLabel(c: BillingState, now: Date = new Date()): string {
  if (c.status === "suspended") return "Suspended";
  if (c.status === "trial") return isWritable(c, now) ? `Trial · ${trialDaysLeft(c, now)} days left` : "Trial ended";
  return isWritable(c, now) ? "Active" : "Payment overdue";
}

/** null limit = unlimited */
export function withinLimit(current: number, limit: number | null): boolean {
  return limit == null || current < limit;
}
