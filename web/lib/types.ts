export type Profile = {
  age: number;
  income_annual: number;
  location: string;
  dependents: number;
  goals: string;
  invest_monthly: number;
  move_in_months: number;
  target_rent: number;
  net_income_factor: number;
};

export type CategoryTotal = { name: string; amount: number };

export type BudgetSnapshot = {
  income_monthly: number;
  burn_monthly: number;
  surplus_monthly: number;
  invest_monthly: number;
  cash_on_hand: number;
  categories: CategoryTotal[];
};

export type ScenarioResult = {
  question: string;
  intent: string;
  headline: string;
  affordable: boolean;
  runway_months: number;
  rent_cap: number;
  current_rent: number;
  target_rent: number;
  invest_monthly: number;
  leftover_monthly: number;
  gap: number;
  cash_needed_for_runway: number;
  months_until_ready: number;
  assumptions: string[];
};

export type Advice = {
  summary: string;
  actions: string[];
};

export type ChatMessage = {
  role: "user" | "multiply" | string;
  text: string;
  actions?: string[];
};

export type CalendarEvent = {
  date: string;
  title: string;
  amount: number;
  kind: string;
};

export type GeminiTrace = {
  configured: boolean;
  categorizer: string;
  advisor: string;
  model: string;
  error: string | null;
};

export type Session = {
  session_id: string;
  status: string;
  mode: string;
  disclaimer: string;
  profile: Profile | null;
  budget: BudgetSnapshot | null;
  scenario: ScenarioResult | null;
  advice: Advice | null;
  workbook_url: string | null;
  workbook_id: string | null;
  txn_count: number;
  last_error: string | null;
  messages: ChatMessage[];
  calendar: CalendarEvent[];
  gemini: GeminiTrace;
  google_sheet_url: string | null;
  html_workbook_url: string | null;
};

export type ReadyStatus = {
  ok: boolean;
  gemini: {
    configured: boolean;
    verified: boolean;
    model: string;
    error: string | null;
  };
  workbook: string;
  calendar: string;
  google_sheet_url: string | null;
};

export const DEMO_PROFILE: Profile = {
  age: 24,
  income_annual: 50000,
  location: "Austin, TX",
  dependents: 0,
  goals: "Move into my own apartment in 6 months while starting to invest.",
  invest_monthly: 200,
  move_in_months: 6,
  target_rent: 1450,
  net_income_factor: 0.78,
};

export const SUGGESTED_QUESTIONS = [
  "Can I afford a $1,450 apartment while investing $200/month?",
  "Where is my money going each month?",
  "Can I start investing $200 a month anyway?",
  "What if rent is $975 instead?",
  "When can I move out?",
];
