"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/mockData";
import ThemeToggle from "./ThemeToggle";

const SAMPLE_PROFILE = {
  name: "Jordan",
  age: "24",
  location: "Austin, TX",
  income: "4166",
  spending: "1697",
  dependents: "0",
  priorities: ["Build an emergency fund", "Start investing"],
};

const PRIORITY_OPTIONS = [
  "Build an emergency fund",
  "Pay off debt",
  "Save for a move",
  "Start investing",
  "Buy a home someday",
  "Just spend less day-to-day",
];

export default function OnboardingModal({
  onComplete,
  onCancel,
  initialProfile,
}: {
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
  initialProfile?: UserProfile;
}) {
  const isEditing = Boolean(initialProfile);
  const [step, setStep] = useState<"profile" | "consent">("profile");
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [age, setAge] = useState(initialProfile ? String(initialProfile.age) : "");
  const [location, setLocation] = useState(initialProfile?.location ?? "");
  const [income, setIncome] = useState(
    initialProfile ? String(initialProfile.monthlyIncome) : ""
  );
  const [spending, setSpending] = useState(
    initialProfile ? String(initialProfile.monthlySpendingEstimate) : ""
  );
  const [dependents, setDependents] = useState(
    initialProfile ? String(initialProfile.dependents) : "0"
  );
  const [priorities, setPriorities] = useState<string[]>(
    initialProfile?.priorities ?? []
  );
  const [priorityNote, setPriorityNote] = useState(initialProfile?.priorityNote ?? "");
  const [consented, setConsented] = useState(isEditing);

  const profileValid = name.trim() && age && location.trim() && income;

  function fillSampleData() {
    setName(SAMPLE_PROFILE.name);
    setAge(SAMPLE_PROFILE.age);
    setLocation(SAMPLE_PROFILE.location);
    setIncome(SAMPLE_PROFILE.income);
    setSpending(SAMPLE_PROFILE.spending);
    setDependents(SAMPLE_PROFILE.dependents);
    setPriorities(SAMPLE_PROFILE.priorities);
  }

  function togglePriority(p: string) {
    setPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!profileValid) return;
    if (isEditing) {
      submit();
      return;
    }
    setStep("consent");
  }

  function submit() {
    onComplete({
      name: name.trim(),
      age: Number(age),
      location: location.trim(),
      monthlyIncome: Number(income),
      monthlySpendingEstimate: Number(spending) || 0,
      dependents: Number(dependents) || 0,
      priorities,
      priorityNote: priorityNote.trim() || undefined,
    });
  }

  function handleStart() {
    if (!consented) return;
    submit();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] p-6">
        {step === "profile" ? (
          <form onSubmit={handleContinue}>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-[family-name:var(--font-display)] text-2xl italic text-[var(--text)]">
                  {isEditing ? "Edit your details" : "Let's set you up"}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-dim)]">
                  {isEditing
                    ? "Update anything that's changed."
                    : "A few basics so advice actually fits your life. This stays on your device for this demo."}
                </p>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={fillSampleData}
                  className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--gold)] hover:bg-[var(--input-bg)]"
                >
                  Autofill sample data
                </button>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <Field label="Your name">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan"
                  className="input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age">
                  <input
                    type="number"
                    min={16}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="24"
                    className="input"
                  />
                </Field>
                <Field label="Dependents">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={dependents}
                    onChange={(e) => setDependents(e.target.value)}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Location">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Dublin, Ireland"
                  className="input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Monthly income (after tax)">
                  <input
                    type="number"
                    min={0}
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="4000"
                    className="input"
                  />
                </Field>
                <Field label="Roughly, monthly spending">
                  <input
                    type="number"
                    min={0}
                    value={spending}
                    onChange={(e) => setSpending(e.target.value)}
                    placeholder="1700"
                    className="input"
                  />
                </Field>
              </div>

              <div>
                <span className="mb-2 block text-xs text-[var(--text-dim)]">
                  What matters most right now? (pick any)
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePriority(p)}
                      data-selected={priorities.includes(p)}
                      className="chip"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Anything else? (optional)">
                <input
                  value={priorityNote}
                  onChange={(e) => setPriorityNote(e.target.value)}
                  placeholder="e.g. wedding next year, want to quit my job"
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-6 flex gap-3">
              {isEditing && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 rounded-full border border-[var(--border)] py-2.5 text-sm text-[var(--text-dim)]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!profileValid}
                className="flex-1 rounded-full bg-[var(--sage)] py-2.5 text-sm font-medium text-[var(--on-accent)] transition hover:bg-[var(--sage-dim)] disabled:opacity-40"
              >
                {isEditing ? "Save changes" : "Continue"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl italic text-[var(--text)]">
              Before we connect anything
            </h1>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--text-dim)]">
              <li>
                MultiPly gives educational simulations and financial
                literacy guidance — not regulated financial advice.
              </li>
              <li>
                We only collect what&apos;s needed to answer your question.
                Raw banking credentials are never stored on our servers.
              </li>
              <li>
                Sample transaction data is used in this demo. Real account
                data would require your explicit connection consent.
              </li>
            </ul>

            <label className="mt-5 flex items-start gap-2.5 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-0.5"
              />
              <span>I understand and agree to continue.</span>
            </label>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep("profile")}
                className="flex-1 rounded-full border border-[var(--border)] py-2.5 text-sm text-[var(--text-dim)]"
              >
                Back
              </button>
              <button
                onClick={handleStart}
                disabled={!consented}
                className="flex-1 rounded-full bg-[var(--sage)] py-2.5 text-sm font-medium text-[var(--on-accent)] transition hover:bg-[var(--sage-dim)] disabled:opacity-40"
              >
                Start
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--text-dim)]">{label}</span>
      {children}
    </label>
  );
}
