import { NextRequest, NextResponse } from "next/server";
import { AccountSnapshot, categoryBreakdown } from "@/lib/mockData";

// Offline mock only. Live answers go to the orchestrator on :8000
// (`POST /v1/sessions/{id}/messages`). The Next app must not call Gemini.

type ScenarioRequest = {
  prompt: string;
  account: AccountSnapshot;
};

type ScenarioResponse = {
  reply: string;
  verdict: "affordable" | "tight" | "not-yet";
  summary: string;
  numbers: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySurplus: number;
    newMonthlyCost: number;
    remainingAfterChange: number;
  };
  breakdown: { category: string; total: number }[];
  budgetUpdate: null;
  source: "mock";
};

function runMockScenario(prompt: string, account: AccountSnapshot): ScenarioResponse {
  const breakdown = categoryBreakdown(account);
  const monthlyExpenses = breakdown.reduce((sum, item) => sum + item.total, 0);
  const monthlySurplus = account.monthlyIncome - monthlyExpenses;
  const currentRent = account.upcomingBills.find((bill) => bill.name === "Rent")?.amount ?? 0;

  const rentMatch = prompt.match(/\$?(\d{3,5})/);
  const investMatch = prompt.match(/invest.*?\$?(\d{2,4})/i);
  const newRent = rentMatch ? Number(rentMatch[1]) : currentRent;
  const newInvestment = investMatch ? Number(investMatch[1]) : 0;

  const newMonthlyCost = newRent - currentRent + newInvestment;
  const remainingAfterChange = monthlySurplus - newMonthlyCost;
  const verdict: ScenarioResponse["verdict"] =
    remainingAfterChange > 300 ? "affordable" : remainingAfterChange > 0 ? "tight" : "not-yet";

  const verdictCopy = {
    affordable: `Yes — after that change, you'd still have about $${Math.max(
      remainingAfterChange,
      0
    ).toFixed(0)} left over each month.`,
    tight: `It's tight. You'd clear it, but only about $${Math.max(
      remainingAfterChange,
      0
    ).toFixed(0)} of breathing room is left each month — one surprise bill and you're short.`,
    "not-yet": `Not comfortably yet. At your current spending, this would put you about $${Math.abs(
      remainingAfterChange
    ).toFixed(0)} in the red each month. Here's what would need to change first.`,
  };

  return {
    reply: verdictCopy[verdict],
    verdict,
    summary: `Based on $${account.monthlyIncome}/mo income and $${monthlyExpenses.toFixed(
      0
    )}/mo current spending in ${account.location}.${
      account.priorities.length > 0
        ? ` Keeping in mind: ${account.priorities.join(", ").toLowerCase()}.`
        : ""
    }`,
    numbers: {
      monthlyIncome: account.monthlyIncome,
      monthlyExpenses,
      monthlySurplus,
      newMonthlyCost,
      remainingAfterChange,
    },
    breakdown,
    budgetUpdate: null,
    source: "mock",
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ScenarioRequest;
  if (!body?.prompt?.trim() || !body?.account) {
    return NextResponse.json({ error: "prompt and account are required" }, { status: 400 });
  }
  return NextResponse.json(runMockScenario(body.prompt, body.account));
}
