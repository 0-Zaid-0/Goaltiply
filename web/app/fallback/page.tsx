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
    <main>
      <div className="wrap">
        <header className="nav">
          <Link className="mark" href="/">
            <strong>MultiPly</strong>
            <span>Stage fallback</span>
          </Link>
          <Link className="btn btn-primary" href="/app">
            Try live demo
          </Link>
        </header>
        <p className="lede" style={{ maxWidth: "62ch", marginBottom: 28 }}>
          Use this if wifi, Gemini, or the API die on stage. Same demo persona:
          24, Austin, $50k, roommate rent $1,050, target $1,450, invest $200.
          Educational, not advice.
        </p>
        {BEATS.map((beat) => (
          <article key={beat.q} className="panel" style={{ marginBottom: 14 }}>
            <p className="quote">{beat.q}</p>
            <p className="lede" style={{ fontSize: 15, margin: 0 }}>
              {beat.a}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
