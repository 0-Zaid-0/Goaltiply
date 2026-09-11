type Verdict = "affordable" | "tight" | "not-yet";

const verdictStyles: Record<Verdict, { label: string; color: string; bg: string }> = {
  affordable: { label: "You can afford this", color: "#0f1b2d", bg: "var(--sage)" },
  tight: { label: "It's tight", color: "#0f1b2d", bg: "var(--gold)" },
  "not-yet": { label: "Not yet", color: "var(--text)", bg: "var(--clay)" },
};

export default function ScenarioCard({
  verdict,
  summary,
  numbers,
}: {
  verdict: Verdict;
  summary: string;
  numbers: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySurplus: number;
    newMonthlyCost: number;
    remainingAfterChange: number;
  };
}) {
  const style = verdictStyles[verdict];
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] p-5">
      <span
        className="inline-block rounded-full px-3 py-1 text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {style.label}
      </span>
      <p className="mt-3 text-sm text-[var(--text-dim)]">{summary}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat label="Monthly income" value={numbers.monthlyIncome} />
        <Stat label="Monthly spending" value={numbers.monthlyExpenses} />
        <Stat label="Change in cost" value={numbers.newMonthlyCost} signed />
        <Stat
          label="Left over after"
          value={numbers.remainingAfterChange}
          signed
          emphasize
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  signed,
  emphasize,
}: {
  label: string;
  value: number;
  signed?: boolean;
  emphasize?: boolean;
}) {
  const display = signed && value > 0 ? `+$${value.toFixed(0)}` : `$${value.toFixed(0)}`;
  return (
    <div className="rounded-lg bg-[var(--input-bg)] px-3 py-2">
      <p className="text-[11px] text-[var(--text-dim)]">{label}</p>
      <p
        className={`mt-0.5 font-[family-name:var(--font-display)] ${
          emphasize ? "text-lg" : "text-base"
        } text-[var(--text)]`}
      >
        {display}
      </p>
    </div>
  );
}
