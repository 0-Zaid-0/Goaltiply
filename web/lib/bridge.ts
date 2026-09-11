import type { ChatMessage } from "@/components/ChatFeed";
import type { AccountSnapshot, UserProfile } from "@/lib/mockData";
import type { Profile, ScenarioResult, Session } from "@/lib/types";

export function toOrchestratorProfile(profile: UserProfile): Profile {
  const investing = profile.priorities.some((item) => /invest/i.test(item));
  const goals = [...profile.priorities, profile.priorityNote]
    .filter((item): item is string => Boolean(item && item.trim()))
    .join("; ");
  return {
    age: profile.age,
    income_annual: profile.monthlyIncome * 12,
    location: profile.location,
    dependents: profile.dependents,
    goals: goals || "Move into my own apartment while starting to invest.",
    invest_monthly: investing ? 200 : 0,
    move_in_months: 6,
    target_rent: 1450,
    net_income_factor: 1,
  };
}

export function verdictFrom(scenario: ScenarioResult): "affordable" | "tight" | "not-yet" {
  if (!scenario.affordable || scenario.headline === "Not yet") {
    return "not-yet";
  }
  if (scenario.leftover_monthly >= 0 && scenario.leftover_monthly < 300) {
    return "tight";
  }
  return "affordable";
}

export function sheetIdFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1];
}

export function accountFromSession(profile: UserProfile, session: Session): AccountSnapshot {
  const budget = session.budget;
  return {
    ...profile,
    monthlyIncome: budget?.income_monthly ?? profile.monthlyIncome,
    googleSheetId: profile.googleSheetId ?? sheetIdFromUrl(session.google_sheet_url),
    currentBalance: budget?.cash_on_hand ?? 0,
    transactions: (budget?.categories ?? []).map((category, index) => ({
      id: `cat-${index}`,
      date: new Date().toISOString().slice(0, 10),
      merchant: category.name,
      category: category.name,
      amount: -Math.abs(category.amount),
    })),
    upcomingBills: session.calendar.map((event) => ({
      name: event.title,
      amount: event.amount,
      dueDate: event.date,
    })),
  };
}

export function chatFromSession(session: Session): ChatMessage[] {
  let lastAssistant = -1;
  session.messages.forEach((message, index) => {
    if (message.role !== "user") {
      lastAssistant = index;
    }
  });

  return session.messages.map((message, index) => {
    if (message.role === "user") {
      return { role: "user" as const, content: message.text };
    }
    if (index === lastAssistant && session.scenario && session.advice) {
      const scenario = session.scenario;
      return {
        role: "assistant" as const,
        content: message.text,
        scenario: {
          verdict: verdictFrom(scenario),
          summary: session.advice.summary,
          numbers: {
            monthlyIncome: session.budget?.income_monthly ?? 0,
            monthlyExpenses: session.budget?.burn_monthly ?? 0,
            monthlySurplus: session.budget?.surplus_monthly ?? 0,
            newMonthlyCost:
              scenario.target_rent - scenario.current_rent + scenario.invest_monthly,
            remainingAfterChange: scenario.leftover_monthly,
          },
        },
      };
    }
    return { role: "assistant" as const, content: message.text };
  });
}
