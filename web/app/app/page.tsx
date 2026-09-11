"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createSession,
  getReady,
  getSession,
  ingest,
  putProfile,
  saveGeminiKey,
  sendMessage,
} from "../../lib/api";
import {
  DEMO_PROFILE,
  SUGGESTED_QUESTIONS,
  type Profile,
  type ReadyStatus,
  type Session,
} from "../../lib/types";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type Step = "connect" | "profile" | "workspace";

export default function AppPage() {
  const [step, setStep] = useState<Step>("connect");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(DEMO_PROFILE);
  const [session, setSession] = useState<Session | null>(null);
  const [draft, setDraft] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [ready, setReady] = useState<ReadyStatus | null>(null);
  const inflight = useRef(false);

  useEffect(() => {
    getReady()
      .then(setReady)
      .catch(() => setReady(null));
  }, []);

  async function persistKey() {
    if (!geminiKey.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await saveGeminiKey(geminiKey.trim());
      setReady(await getReady());
      setGeminiKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gemini key failed.");
    } finally {
      setBusy(false);
    }
  }

  async function startDemo() {
    if (inflight.current) return;
    inflight.current = true;
    setBusy(true);
    setError(null);
    try {
      const created = await createSession("demo");
      setSessionId(created.session_id);
      setStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the orchestrator.");
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }

  async function confirmProfile(event: FormEvent) {
    event.preventDefault();
    if (!sessionId || inflight.current) return;
    inflight.current = true;
    setBusy(true);
    setError(null);
    try {
      await putProfile(sessionId, profile);
      await ingest(sessionId);
      setSession(await getSession(sessionId));
      setDraft("");
      setStep("workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingest failed.");
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }

  async function ask(text: string) {
    if (!sessionId || !text.trim() || inflight.current) return;
    inflight.current = true;
    setBusy(true);
    setError(null);
    try {
      setSession(await sendMessage(sessionId, text.trim()));
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Question failed.");
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }

  const maxCategory = useMemo(() => {
    const cats = session?.budget?.categories ?? [];
    return Math.max(...cats.map((item) => item.amount), 1);
  }, [session]);

  const geminiLive = Boolean(ready?.gemini.verified || session?.gemini.categorizer === "gemini");

  return (
    <div className="app-shell">
      <div className="wrap">
        <header className="nav">
          <Link className="mark" href="/">
            <strong>MultiPly</strong>
            <span>Copilot</span>
          </Link>
          <div className="nav-links">
            <span className={`chip ${geminiLive ? "chip-yes" : "chip-no"}`}>
              {geminiLive ? "Gemini live" : "Gemini fallback"}
            </span>
            {session?.html_workbook_url ? (
              <a className="btn btn-ghost" href={session.html_workbook_url} target="_blank" rel="noreferrer">
                Open budget
              </a>
            ) : null}
            {session?.workbook_url ? (
              <a className="btn btn-ghost" href={session.workbook_url}>
                Excel
              </a>
            ) : null}
            {session?.google_sheet_url ? (
              <a className="btn btn-ghost" href={session.google_sheet_url} target="_blank" rel="noreferrer">
                Google Sheet
              </a>
            ) : null}
          </div>
        </header>

        {error ? <p className="error">{error}</p> : null}

        {step === "connect" ? (
          <section className="connect panel">
            <div className="eyebrow">Google AI hackathon · stage path</div>
            <h1 className="serif" style={{ fontSize: 40, margin: "8px 0 12px" }}>
              Paste Gemini, then connect the demo bank.
            </h1>
            <p className="lede">
              Create a key at aistudio.google.com/apikey. The demo still runs
              without it; judges will want Gemini on for categorisation and advice.
            </p>
            <label style={{ marginTop: 16 }}>
              Gemini API key
              <input
                type="password"
                autoComplete="off"
                placeholder="AIza…"
                value={geminiKey}
                onChange={(event) => setGeminiKey(event.target.value)}
              />
            </label>
            <p className="fine" style={{ padding: "8px 0 0" }}>
              {ready?.gemini.verified
                ? `Gemini verified (${ready.gemini.model}).`
                : ready?.gemini.error || "Key stays on the local orchestrator only."}
            </p>
            <div className="hero-actions">
              <button className="btn btn-ghost" onClick={persistKey} disabled={busy || !geminiKey.trim()}>
                {busy ? "Checking…" : "Save and verify Gemini"}
              </button>
              <button className="btn btn-primary" onClick={startDemo} disabled={busy}>
                {busy ? "Connecting…" : "Use demo bank data"}
              </button>
            </div>
          </section>
        ) : null}

        {step === "profile" ? (
          <form className="connect panel" onSubmit={confirmProfile}>
            <div className="eyebrow">Life parameters</div>
            <h1 className="serif" style={{ fontSize: 36, margin: "8px 0 16px" }}>
              What are we planning around?
            </h1>
            <div className="form-grid">
              <Field label="Age" value={profile.age} onChange={(v) => setProfile({ ...profile, age: Number(v) })} />
              <Field
                label="Gross income (year)"
                value={profile.income_annual}
                onChange={(v) => setProfile({ ...profile, income_annual: Number(v) })}
              />
              <label>
                Location
                <input
                  value={profile.location}
                  onChange={(event) => setProfile({ ...profile, location: event.target.value })}
                />
              </label>
              <Field
                label="Dependents"
                value={profile.dependents}
                onChange={(v) => setProfile({ ...profile, dependents: Number(v) })}
              />
              <Field
                label="Invest each month"
                value={profile.invest_monthly}
                onChange={(v) => setProfile({ ...profile, invest_monthly: Number(v) })}
              />
              <Field
                label="Move in (months)"
                value={profile.move_in_months}
                onChange={(v) => setProfile({ ...profile, move_in_months: Number(v) })}
              />
              <Field
                label="Target rent"
                value={profile.target_rent}
                onChange={(v) => setProfile({ ...profile, target_rent: Number(v) })}
              />
              <label style={{ gridColumn: "1 / -1" }}>
                Goal
                <input
                  value={profile.goals}
                  onChange={(event) => setProfile({ ...profile, goals: event.target.value })}
                />
              </label>
            </div>
            <div className="hero-actions">
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Running copilot…" : "Build budget and ask the apartment question"}
              </button>
            </div>
          </form>
        ) : null}

        {step === "workspace" && session ? (
          <section className="workspace">
            <div className="chat">
              <div className="chat-log">
                {session.messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`bubble ${message.role === "user" ? "user" : "bot"}`}>
                    <div>{message.text}</div>
                    {message.actions?.length ? (
                      <ol className="actions">
                        {message.actions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                ))}
                <p className="fine" style={{ padding: 0 }}>
                  {session.disclaimer} · categorizer {session.gemini.categorizer} · advisor{" "}
                  {session.gemini.advisor}
                </p>
              </div>
              <form className="composer" onSubmit={(event) => { event.preventDefault(); void ask(draft); }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {SUGGESTED_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "6px 10px", fontSize: 12 }}
                        disabled={busy}
                        onClick={() => void ask(question)}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ask a different question — the answer should change"
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? "…" : "Ask"}
                </button>
              </form>
            </div>

            <aside>
              {session.scenario ? (
                <div className="panel" style={{ marginBottom: 14 }}>
                  <div className="eyebrow">Scenario engine (code, not Gemini)</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <span className={`chip ${session.scenario.affordable ? "chip-yes" : "chip-no"}`}>
                      {session.scenario.headline}
                    </span>
                    <span className="fine" style={{ padding: 0 }}>
                      Gap {money.format(session.scenario.gap)}
                    </span>
                  </div>
                  <p className="lede" style={{ fontSize: 14, marginTop: 12 }}>
                    Rent cap {money.format(session.scenario.rent_cap)} · target{" "}
                    {money.format(session.scenario.target_rent)} · runway{" "}
                    {session.scenario.runway_months.toFixed(1)} months
                  </p>
                </div>
              ) : null}

              {session.budget ? (
                <>
                  <div className="stat-grid">
                    <div className="stat">
                      <span>Take-home</span>
                      <b>{money.format(session.budget.income_monthly)}</b>
                    </div>
                    <div className="stat">
                      <span>Spending</span>
                      <b>{money.format(session.budget.burn_monthly)}</b>
                    </div>
                    <div className="stat">
                      <span>Surplus</span>
                      <b>{money.format(session.budget.surplus_monthly)}</b>
                    </div>
                    <div className="stat">
                      <span>Cash</span>
                      <b>{money.format(session.budget.cash_on_hand)}</b>
                    </div>
                  </div>
                  <div className="panel" style={{ marginBottom: 14 }}>
                    <h3>Where it goes</h3>
                    <div className="bars">
                      {session.budget.categories.map((item) => (
                        <div className="bar-row" key={item.name}>
                          <span>{item.name}</span>
                          <div className="track">
                            <div
                              className="fill"
                              style={{ width: `${Math.max(8, (item.amount / maxCategory) * 100)}%` }}
                            />
                          </div>
                          <span>{money.format(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {session.calendar?.length ? (
                <div className="panel">
                  <h3>Calendar MCP</h3>
                  <div className="bars">
                    {session.calendar.slice(0, 8).map((event) => (
                      <div
                        className="bar-row"
                        key={`${event.date}-${event.title}`}
                        style={{ gridTemplateColumns: "72px 1fr 72px" }}
                      >
                        <span>{event.date.slice(5)}</span>
                        <span>{event.title}</span>
                        <span>{money.format(event.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input type="number" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
