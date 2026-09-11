"use client";

import ScenarioCard from "./ScenarioCard";

export type ChatMessage =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      scenario?: {
        verdict: "affordable" | "tight" | "not-yet";
        summary: string;
        numbers: {
          monthlyIncome: number;
          monthlyExpenses: number;
          monthlySurplus: number;
          newMonthlyCost: number;
          remainingAfterChange: number;
        };
      };
    };

export default function ChatFeed({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-6">
        <p className="font-[family-name:var(--font-display)] text-3xl italic text-[var(--text)]">
          What do you want to know?
        </p>
        <p className="mt-3 max-w-sm text-sm text-[var(--text-dim)]">
          Ask about a move, a purchase, or where to start investing —
          MultiPly reads your real transactions to answer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((m, i) => (
        <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
          <div
            className={
              m.role === "user"
                ? "max-w-lg rounded-2xl rounded-br-sm bg-[var(--sage)] px-4 py-2.5 text-sm text-[var(--on-accent)]"
                : "max-w-lg space-y-3"
            }
          >
            {m.role === "assistant" ? (
              <>
                <p className="rounded-2xl rounded-bl-sm bg-[var(--bg-raised)] px-4 py-2.5 text-sm text-[var(--text)]">
                  {m.content}
                </p>
                {m.scenario && (
                  <ScenarioCard
                    verdict={m.scenario.verdict}
                    summary={m.scenario.summary}
                    numbers={m.scenario.numbers}
                  />
                )}
              </>
            ) : (
              m.content
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
