"use client";

import { AccountSnapshot } from "@/lib/mockData";
import type { ReadyStatus } from "@/lib/types";
import { FormEvent, useState } from "react";

export default function Sidebar({
  account,
  onEditProfile,
  ready,
  live,
  onSaveGemini,
  geminiBusy,
}: {
  account: AccountSnapshot;
  onEditProfile: () => void;
  ready: ReadyStatus | null;
  live: boolean;
  onSaveGemini: (key: string) => void;
  geminiBusy?: boolean;
}) {
  const [geminiKey, setGeminiKey] = useState("");
  const geminiOn = Boolean(ready?.gemini.verified || ready?.gemini.configured);

  function submitKey(event: FormEvent) {
    event.preventDefault();
    if (!geminiKey.trim()) return;
    onSaveGemini(geminiKey.trim());
    setGeminiKey("");
  }

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col justify-between border-r border-[var(--border)] bg-[var(--bg-raised)] p-6 pb-12">
      <div>
        <div className="font-[family-name:var(--font-display)] text-xl italic text-[var(--text)]">
          MultiPly
        </div>
        <p className="mt-1 text-xs text-[var(--text-dim)]">Financial copilot</p>

        <div className="mt-10 space-y-1">
          <p className="text-[11px] tracking-wide text-[var(--text-dim)]">Connected</p>
          <div className="mt-2 space-y-2">
            {[
              { name: "Bank MCP", on: live },
              { name: "Budget MCP", on: live },
              { name: "Calendar MCP", on: live },
              { name: "Gemini", on: geminiOn },
            ].map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
              >
                <span>{row.name}</span>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: row.on ? "var(--sage)" : "var(--clay)" }}
                />
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submitKey} className="mt-6 space-y-2">
          <p className="text-[11px] tracking-wide text-[var(--text-dim)]">Gemini API key</p>
          <input
            type="password"
            value={geminiKey}
            onChange={(event) => setGeminiKey(event.target.value)}
            placeholder="Paste from AI Studio"
            className="input text-xs"
          />
          <button
            type="submit"
            disabled={geminiBusy || !geminiKey.trim()}
            className="w-full rounded-full bg-[var(--sage)] py-1.5 text-xs font-medium text-[var(--on-accent)] disabled:opacity-40"
          >
            Save and verify
          </button>
          {ready?.gemini.error && (
            <p className="text-[11px] text-[var(--clay)]">{ready.gemini.error}</p>
          )}
        </form>

        <div className="mt-10">
          <p className="text-[11px] tracking-wide text-[var(--text-dim)]">Upcoming bills</p>
          <div className="mt-2 space-y-2">
            {account.upcomingBills.map((bill) => (
              <div key={`${bill.name}-${bill.dueDate}`} className="flex justify-between text-sm">
                <span className="text-[var(--text)]">{bill.name}</span>
                <span className="text-[var(--text-dim)]">${bill.amount}</span>
              </div>
            ))}
          </div>
        </div>
        {account.priorities.length > 0 && (
          <div className="mt-10">
            <p className="text-[11px] tracking-wide text-[var(--text-dim)]">Priorities</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {account.priorities.map((priority) => (
                <span
                  key={priority}
                  className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-dim)]"
                >
                  {priority}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] pt-4">
        <p className="text-sm text-[var(--text)]">{account.name}</p>
        <p className="text-xs text-[var(--text-dim)]">
          {account.location} · Age {account.age}
        </p>
        <button onClick={onEditProfile} className="mt-2 text-xs text-[var(--gold)] hover:underline">
          Edit profile
        </button>
      </div>
    </aside>
  );
}
