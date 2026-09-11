import Link from "next/link";

const BEATS = [
  {
    q: "Can I afford a $1,450 apartment while investing $200/month?",
    a: "Not at $1,450. It is $475 over the $975 rent cap (30% of take-home) and runway would be about 1.6 months. Current rent is $1,050 with a roommate.",
  },
  {
    q: "Where is my money going each month?",
    a: "Spend is ~$2,000+/mo against ~$3,250 take-home. Largest buckets: Housing, Groceries, Dining, Debt. Subscriptions are the first cut, not rent.",
  },
  {
    q: "Can I start investing $200 a month anyway?",
    a: "Yes. $200 fits the surplus. That does not make the $1,450 apartment fit the cap. Invest, but keep rent at or under $975.",
  },
  {
    q: "What if rent is $975 instead?",
    a: "That hits the cap. Runway may still be short of 3 months — save the surplus before signing.",
  },
  {
    q: "When can I move out?",
    a: "Waiting does not raise the 30% cap. Saving only builds the cash cushion. Lower the rent band or raise income.",
  },
];

export default function FallbackPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-baseline justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl italic">MultiPly</p>
            <p className="text-xs text-[var(--text-dim)]">Stage fallback — live demo is down</p>
          </div>
          <Link href="/" className="text-xs text-[var(--gold)] hover:underline">
            Back to app
          </Link>
        </header>
        <div className="space-y-4">
          {BEATS.map((beat) => (
            <article
              key={beat.q}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] p-5"
            >
              <h2 className="text-sm text-[var(--gold)]">{beat.q}</h2>
              <p className="mt-2 text-sm text-[var(--text-dim)]">{beat.a}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
