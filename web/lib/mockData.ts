// Stand-in for what Bank MCP / Budget MCP / Calendar MCP would return.
// Swap fetchMockAccount() for a real MCP client call once live banking
// access is wired up — nothing downstream needs to change shape.

export type Transaction = {
  id: string;
  date: string; // ISO
  merchant: string;
  category: string;
  amount: number; // negative = outflow
};

export type UserProfile = {
  name: string;
  age: number;
  location: string;
  monthlyIncome: number;
  monthlySpendingEstimate: number;
  dependents: number;
  priorities: string[];
  priorityNote?: string;
  googleSheetId?: string;
};

export type AccountSnapshot = UserProfile & {
  currentBalance: number;
  transactions: Transaction[];
  upcomingBills: { name: string; amount: number; dueDate: string }[];
};

// Everything below the profile fields is still simulated transaction
// data — swapping in a real Bank MCP connection later only replaces
// this part, not the user-entered profile.
const simulatedTransactions: Transaction[] = [
  { id: "t2", date: "2026-09-01", merchant: "Rent", category: "Rent", amount: -1450 },
  { id: "t3", date: "2026-09-03", merchant: "Groceries", category: "Groceries", amount: -86.4 },
  { id: "t4", date: "2026-09-05", merchant: "Spotify", category: "Subscriptions", amount: -11.99 },
  { id: "t5", date: "2026-09-06", merchant: "Dining out", category: "Dining", amount: -14.5 },
  { id: "t6", date: "2026-09-08", merchant: "Utilities", category: "Utilities", amount: -74.2 },
  { id: "t7", date: "2026-09-10", merchant: "Shopping", category: "Shopping", amount: -42.1 },
  { id: "t8", date: "2026-09-12", merchant: "Transport", category: "Transport", amount: -18.3 },
];

const simulatedBills = [
  { name: "Rent", amount: 1450, dueDate: "2026-10-01" },
  { name: "Car insurance", amount: 132, dueDate: "2026-10-04" },
  { name: "Student loan", amount: 210, dueDate: "2026-10-15" },
];

export function buildAccount(profile: UserProfile): AccountSnapshot {
  return {
    ...profile,
    currentBalance: 6200,
    transactions: simulatedTransactions,
    upcomingBills: simulatedBills,
  };
}

export function categoryBreakdown(account: AccountSnapshot) {
  const totals = new Map<string, number>();
  for (const t of account.transactions) {
    if (t.amount >= 0) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function savingsRate(account: AccountSnapshot) {
  const breakdown = categoryBreakdown(account);
  const spent = breakdown.reduce((sum, b) => sum + b.total, 0);
  const saved = account.monthlyIncome - spent;
  const rate = account.monthlyIncome > 0 ? (saved / account.monthlyIncome) * 100 : 0;
  return { spent, saved, rate };
}
