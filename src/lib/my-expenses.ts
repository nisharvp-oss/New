/**
 * "My expenses": what one traveler spends on a trip, for themselves only. Nothing here is shared
 * or split; that is the group expenses tool (splitwise.ts).
 */
export const CATEGORIES = [
  { id: "food", label: "Food & drinks" },
  { id: "transport", label: "Transport" },
  { id: "stay", label: "Stay" },
  { id: "activities", label: "Activities" },
  { id: "shopping", label: "Shopping" },
  { id: "other", label: "Other" },
] as const;
export type Category = (typeof CATEGORIES)[number]["id"];

export const CURRENCIES = "USD EUR GBP AED SAR QAR OMR KWD BHD JOD EGP TRY INR PKR LKR THB SGD MYR IDR VND JPY KRW CNY AUD NZD CAD CHF".split(" ");

export type MyExpense = { id: string; amount: number; currency: string; category: Category; note: string; spent_on: string; receipt_path: string | null };
export type Budget = { amount: number; currency: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Totals per currency (largest first), each with its categories (largest first). Currencies are never mixed. */
export function totalsByCurrency(list: MyExpense[]) {
  const map = new Map<string, Map<Category, number>>();
  for (const e of list) {
    const cats = map.get(e.currency) ?? new Map<Category, number>();
    cats.set(e.category, (cats.get(e.category) ?? 0) + e.amount);
    map.set(e.currency, cats);
  }
  return [...map].map(([currency, cats]) => ({
    currency,
    total: round2([...cats.values()].reduce((s, n) => s + n, 0)),
    categories: [...cats].map(([category, total]) => ({ category, total: round2(total) })).sort((a, b) => b.total - a.total),
  })).sort((a, b) => b.total - a.total);
}

/** Expenses grouped by day, newest day first, with each day's totals per currency. */
export function byDay(list: MyExpense[]) {
  const days = new Map<string, MyExpense[]>();
  for (const e of list) days.set(e.spent_on, [...(days.get(e.spent_on) ?? []), e]);
  return [...days].sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => ({
    date,
    items,
    totals: totalsByCurrency(items).map(({ currency, total }) => ({ currency, total })),
  }));
}

/** Spending against a budget in the budget's currency; other currencies aren't counted. */
export function budgetStatus(list: MyExpense[], budget: Budget) {
  const spent = round2(list.filter((e) => e.currency === budget.currency).reduce((s, e) => s + e.amount, 0));
  const left = round2(budget.amount - spent);
  return { spent, left, over: left < 0, pct: budget.amount > 0 ? Math.min(100, Math.round((spent / budget.amount) * 100)) : 0 };
}

export function formatMoney(amount: number, currency: string) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount); } catch { return `${amount.toFixed(2)} ${currency}`; }
}
