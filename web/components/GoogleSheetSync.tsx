"use client";

import { useState } from "react";
import { AccountSnapshot } from "@/lib/mockData";

export default function GoogleSheetSync({
  account,
  sheetId,
  onSheetIdChange,
}: {
  account: AccountSnapshot;
  sheetId?: string;
  onSheetIdChange: (sheetId: string) => void;
}) {
  const [editing, setEditing] = useState(!sheetId);
  const [input, setInput] = useState(sheetId ?? "");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/export-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId: input.trim(), account }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't connect that sheet.");
        return;
      }
      onSheetIdChange(input.trim());
      setLastSynced(data.syncedAt);
      setEditing(false);
    } catch {
      setError("Something went wrong reaching the sync service.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSyncNow() {
    if (!sheetId) return;
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/export-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, account }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sync failed.");
        return;
      }
      setLastSynced(data.syncedAt);
    } catch {
      setError("Something went wrong reaching the sync service.");
    } finally {
      setSyncing(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleConnect} className="mt-5 space-y-2">
        <label className="block text-xs text-[var(--text-dim)]">
          Google Sheet ID
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            className="input mt-1"
          />
        </label>
        <p className="text-[11px] text-[var(--text-dim)]">
          Find it in your sheet&apos;s URL: docs.google.com/spreadsheets/d/
          <span className="text-[var(--gold)]">THIS_PART</span>/edit
        </p>
        {error && <p className="text-[11px] text-[var(--clay)]">{error}</p>}
        <button
          type="submit"
          disabled={!input.trim() || syncing}
          className="w-full rounded-full bg-[var(--sage)] py-2 text-xs font-medium text-[var(--on-accent)] transition hover:bg-[var(--sage-dim)] disabled:opacity-40"
        >
          {syncing ? "Connecting…" : "Connect sheet"}
        </button>
      </form>
    );
  }

  return (
    <div className="mt-5 space-y-2">
      <div className="flex items-center justify-between">
        <a
          href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[var(--gold)] hover:underline"
        >
          Open auto-updating Google Sheet
        </a>
        <button
          onClick={() => setEditing(true)}
          className="text-[11px] text-[var(--text-dim)] hover:underline"
        >
          Change
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-dim)]">
          {lastSynced
            ? `Synced ${new Date(lastSynced).toLocaleTimeString()}`
            : "Not synced yet"}
        </span>
        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text)] hover:bg-[var(--input-bg)] disabled:opacity-40"
        >
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>
      {error && <p className="text-[11px] text-[var(--clay)]">{error}</p>}
    </div>
  );
}
