"use client";

import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/Sidebar";
import ChatFeed, { ChatMessage } from "@/components/ChatFeed";
import InputBar from "@/components/InputBar";
import BudgetDashboard from "@/components/BudgetDashboard";
import OnboardingModal from "@/components/OnboardingModal";
import { buildAccount, AccountSnapshot, UserProfile } from "@/lib/mockData";
import {
  createSession,
  getReady,
  getSession,
  ingest,
  putProfile,
  saveGeminiKey,
  sendMessage,
} from "@/lib/api";
import { SUGGESTED_QUESTIONS, type ReadyStatus, type Session } from "@/lib/types";
import {
  accountFromSession,
  chatFromSession,
  sheetIdFromUrl,
  toOrchestratorProfile,
} from "@/lib/bridge";

const STORAGE_KEY = "multiply-profile";

export default function Home() {
  const [account, setAccount] = useState<AccountSnapshot | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState<ReadyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connecting = useRef(false);

  useEffect(() => {
    getReady()
      .then(setReady)
      .catch(() => setReady(null));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setHydrated(true);
      return;
    }
    try {
      const stored = JSON.parse(saved) as UserProfile;
      void connect(stored, { restore: true });
    } catch {
      setHydrated(true);
    }
  }, []);

  async function connect(nextProfile: UserProfile, opts: { restore?: boolean } = {}) {
    if (connecting.current) return;
    connecting.current = true;
    setLoading(true);
    setError(null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setEditing(false);
    try {
      const created = await createSession("demo");
      await putProfile(created.session_id, toOrchestratorProfile(nextProfile));
      await ingest(created.session_id, false);
      const nextSession = await getSession(created.session_id);
      const withSheet: UserProfile = {
        ...nextProfile,
        googleSheetId:
          nextProfile.googleSheetId ?? sheetIdFromUrl(nextSession.google_sheet_url),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withSheet));
      setProfile(withSheet);
      setSessionId(created.session_id);
      setSession(nextSession);
      setAccount(accountFromSession(withSheet, nextSession));
      setMessages(chatFromSession(nextSession));
      setLive(true);
      setReady(await getReady().catch(() => null));
    } catch {
      setLive(false);
      setSessionId(null);
      setSession(null);
      setAccount(buildAccount(nextProfile));
      if (!opts.restore) {
        setMessages([]);
      }
      setError("Orchestrator is offline — using the local mock until :8000 is up.");
    } finally {
      connecting.current = false;
      setLoading(false);
      setHydrated(true);
    }
  }

  function handleSheetIdChange(sheetId: string) {
    if (!profile || !account) return;
    const updated = { ...profile, googleSheetId: sheetId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProfile(updated);
    setAccount({ ...account, googleSheetId: sheetId });
  }

  async function persistGemini(apiKey: string) {
    setLoading(true);
    setError(null);
    try {
      await saveGeminiKey(apiKey);
      setReady(await getReady());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the Gemini key.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(text: string) {
    if (!account || !profile) return;
    setLoading(true);
    setError(null);
    if (live && sessionId) {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      try {
        const nextSession = await sendMessage(sessionId, text);
        setSession(nextSession);
        setAccount(accountFromSession(profile, nextSession));
        setMessages(chatFromSession(nextSession));
      } catch (err) {
        setError(err instanceof Error ? err.message : "The orchestrator did not answer.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, account }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          scenario: {
            verdict: data.verdict,
            summary: data.summary,
            numbers: data.numbers,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)] text-sm text-[var(--text-dim)]">
        Loading MultiPly…
      </div>
    );
  }

  if (!account) {
    return <OnboardingModal onComplete={(next) => void connect(next)} />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        account={account}
        onEditProfile={() => setEditing(true)}
        ready={ready}
        live={live}
        onSaveGemini={(key) => void persistGemini(key)}
        geminiBusy={loading}
      />

      {editing && (
        <OnboardingModal
          initialProfile={account}
          onComplete={(next) => void connect(next)}
          onCancel={() => setEditing(false)}
        />
      )}

      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl text-[var(--text)]">
              Ask MultiPly
            </h1>
            <p className="text-xs text-[var(--text-dim)]">
              Educational simulations, not regulated financial advice.
              {live ? " Calculator on :8000." : " Mock mode."}
            </p>
            {error && <p className="mt-1 text-xs text-[var(--clay)]">{error}</p>}
          </div>
          <ThemeToggle />
        </header>

        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col overflow-hidden px-6 py-4">
            <div className="flex-1 overflow-y-auto">
              <ChatFeed messages={messages} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="chip"
                  disabled={loading}
                  onClick={() => void handleSend(question)}
                >
                  {question}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <InputBar onSend={(text) => void handleSend(text)} disabled={loading} />
            </div>
          </div>

          <div className="hidden overflow-y-auto border-l border-[var(--border)] px-6 py-4 lg:block">
            <BudgetDashboard
              account={account}
              onSheetIdChange={handleSheetIdChange}
              htmlUrl={session?.html_workbook_url}
              xlsxUrl={session?.workbook_url}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
