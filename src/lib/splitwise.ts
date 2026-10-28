export type Split = { memberId: string; amount: number };
export type Expense = {
  id: string;
  groupId: string;
  paidBy: string;
  amount: number;
  description: string;
  splitType: "equal" | "exact" | "percent";
  splits: Split[];
  createdAt: string;
};
export type Settlement = { id: string; groupId: string; from: string; to: string; amount: number };
export type Transfer = { from: string; to: string; amount: number };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Build owed amounts from a split type. `values` = exact amounts or percentages per member. */
export function computeSplits(
  amount: number,
  memberIds: string[],
  type: Expense["splitType"],
  values: Record<string, number> = {},
): Split[] {
  if (type === "equal") {
    const base = Math.floor((amount / memberIds.length) * 100) / 100;
    let rem = r2(amount - base * memberIds.length);
    return memberIds.map((id) => {
      const extra = rem > 0 ? 0.01 : 0;
      rem = r2(rem - extra);
      return { memberId: id, amount: r2(base + extra) };
    });
  }
  if (type === "percent") {
    return memberIds.map((id) => ({ memberId: id, amount: r2((amount * (values[id] ?? 0)) / 100) }));
  }
  return memberIds.map((id) => ({ memberId: id, amount: r2(values[id] ?? 0) }));
}

/** Net balance per member: positive = is owed, negative = owes. */
export function netBalances(expenses: Expense[], settlements: Settlement[] = []) {
  const b: Record<string, number> = {};
  const add = (id: string, v: number) => (b[id] = r2((b[id] ?? 0) + v));
  for (const e of expenses) {
    add(e.paidBy, e.amount);
    for (const s of e.splits) add(s.memberId, -s.amount);
  }
  for (const s of settlements) {
    add(s.from, s.amount);
    add(s.to, -s.amount);
  }
  return b;
}

/** Greedy debt simplification: minimal-ish list of transfers. */
export function simplifyDebts(balances: Record<string, number>): Transfer[] {
  const debtors = Object.entries(balances).filter(([, v]) => v < -0.005).map(([id, v]) => ({ id, v: -v }));
  const creditors = Object.entries(balances).filter(([, v]) => v > 0.005).map(([id, v]) => ({ id, v }));
  debtors.sort((a, b) => b.v - a.v);
  creditors.sort((a, b) => b.v - a.v);
  const out: Transfer[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!, c = creditors[j]!;
    const amt = r2(Math.min(d.v, c.v));
    if (amt > 0) out.push({ from: d.id, to: c.id, amount: amt });
    d.v = r2(d.v - amt);
    c.v = r2(c.v - amt);
    if (d.v <= 0.005) i++;
    if (c.v <= 0.005) j++;
  }
  return out;
}
