"use client";

import { useState } from "react";

export default function InputBar({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-2.5 shadow-lg"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Can I afford to move next spring?"
        className="w-full bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-dim)] outline-none"
      />
      <button
        type="submit"
        disabled={disabled}
        className="shrink-0 rounded-full bg-[var(--sage)] px-4 py-1.5 text-xs font-medium text-[var(--on-accent)] transition hover:bg-[var(--sage-dim)] disabled:opacity-50"
      >
        {disabled ? "Thinking…" : "Ask"}
      </button>
    </form>
  );
}
