import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div className="wrap">
        <header className="nav">
          <div className="mark">
            <strong>MultiPly</strong>
            <span>Google AI hackathon</span>
          </div>
          <div className="nav-links">
            <Link href="/fallback">Stage fallback</Link>
            <Link className="btn btn-primary" href="/app">
              Open demo
            </Link>
          </div>
        </header>

        <section className="hero">
          <div>
            <div className="eyebrow">AI for ease</div>
            <h1>Can you afford the apartment — and still invest $200?</h1>
            <p className="lede">
              Gemini categorises a young-adult bank ledger. Code decides
              affordability. Gemini explains. The judge leaves with a budget
              workbook — Excel, HTML, or Google Sheet.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/app">
                Run the $50k Austin demo
              </Link>
              <a className="btn btn-ghost" href="http://localhost:8000/docs">
                Orchestrator API
              </a>
            </div>
          </div>
          <aside className="panel">
            <h3>90-second script</h3>
            <p className="quote">“I’m 24, make $50k, want to move and invest $200. Can I afford it?”</p>
            <span className="chip chip-no">Not yet</span>
            <p className="lede" style={{ marginTop: 14, fontSize: 14 }}>
              1. Paste Gemini key · 2. Demo bank · 3. Build budget · 4. Hit the
              chips (spending, $975 rent, when can I move). Calculator wins;
              Gemini only narrates.
            </p>
          </aside>
        </section>

        <section className="steps">
          <article className="step">
            <small>01 — Gemini</small>
            <h2>Two slots only</h2>
            <p>Categorise merchants to JSON. Explain the scenario result. Never invent a yes.</p>
          </article>
          <article className="step">
            <small>02 — MCP-shaped</small>
            <h2>Bank · Calendar · Budget</h2>
            <p>Demo fixtures today. Same payloads your team’s Excel MCP and a real bank can take.</p>
          </article>
          <article className="step">
            <small>03 — Artifact</small>
            <h2>Workbook the user owns</h2>
            <p>Overview, Transactions, Budget, Scenario — plus upcoming bills from Calendar MCP.</p>
          </article>
        </section>

        <p className="fine">
          Educational simulation, not fiduciary advice. If the live demo fails, open{" "}
          <Link href="/fallback">Stage fallback</Link>.
        </p>
      </div>
    </main>
  );
}
