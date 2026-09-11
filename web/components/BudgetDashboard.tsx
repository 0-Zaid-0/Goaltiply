import { AccountSnapshot, categoryBreakdown, savingsRate } from "@/lib/mockData";
import SpendingDonut from "./SpendingDonut";
import GoogleSheetSync from "./GoogleSheetSync";

export default function BudgetDashboard({
  account,
  onSheetIdChange,
  htmlUrl,
  xlsxUrl,
}: {
  account: AccountSnapshot;
  onSheetIdChange: (sheetId: string) => void;
  htmlUrl?: string | null;
  xlsxUrl?: string | null;
}) {
  const breakdown = categoryBreakdown(account);
  const max = Math.max(...breakdown.map((item) => item.total), 1);
  const { rate, saved } = savingsRate(account);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg italic text-[var(--text)]">
            Where it&apos;s going
          </h2>
          <span className="text-xs text-[var(--text-dim)]">This month</span>
        </div>

        {breakdown.length > 0 && <SpendingDonut breakdown={breakdown} />}

        <div className="mt-2 space-y-3">
          {breakdown.map((item) => (
            <div key={item.category}>
              <div className="flex justify-between text-xs text-[var(--text-dim)]">
                <span>{item.category}</span>
                <span>${item.total.toFixed(0)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-[var(--input-bg)]">
                <div
                  className="h-2 rounded-full bg-[var(--sage)]"
                  style={{ width: `${(item.total / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <GoogleSheetSync
          account={account}
          sheetId={account.googleSheetId}
          onSheetIdChange={onSheetIdChange}
        />

        <div className="mt-4 flex flex-col gap-2">
          {htmlUrl && (
            <a
              href={htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--gold)] hover:underline"
            >
              Open budget HTML
            </a>
          )}
          {xlsxUrl && (
            <a href={xlsxUrl} className="text-xs text-[var(--gold)] hover:underline">
              Download Excel
            </a>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] p-5">
        <h3 className="text-xs text-[var(--text-dim)]">Savings rate</h3>
        <p className="mt-1 font-[family-name:var(--font-display)] text-2xl italic text-[var(--text)]">
          {rate.toFixed(0)}%
        </p>
        <p className="mt-1 text-xs text-[var(--text-dim)]">
          {rate >= 20
            ? `Strong pace — about $${saved.toFixed(0)} left over this month.`
            : rate >= 0
              ? `About $${saved.toFixed(0)} left over. Aiming for 20% builds a buffer faster.`
              : `Spending is outpacing income by about $${Math.abs(saved).toFixed(0)} this month.`}
        </p>
      </div>
    </div>
  );
}
