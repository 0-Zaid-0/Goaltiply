from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Disclaimer = "Educational simulation, not financial advice."


class Profile(BaseModel):
    age: int = 24
    income_annual: float = 50_000
    location: str = "Austin, TX"
    dependents: int = 0
    goals: str = "Move into my own apartment in 6 months while starting to invest."
    invest_monthly: float = 200
    move_in_months: int = 6
    target_rent: float = 1_450
    net_income_factor: float = 0.78


class Transaction(BaseModel):
    txn_id: str
    date: str
    merchant: str
    amount: float
    memo: str = ""
    category: str | None = None
    subcategory: str | None = None
    is_recurring: bool = False
    confidence: float = 1.0


class CategoryTotal(BaseModel):
    name: str
    amount: float


class BudgetSnapshot(BaseModel):
    income_monthly: float
    burn_monthly: float
    surplus_monthly: float
    invest_monthly: float
    cash_on_hand: float
    categories: list[CategoryTotal]


class ScenarioResult(BaseModel):
    question: str
    intent: str = "housing"
    headline: str = "Not yet"
    affordable: bool
    runway_months: float
    rent_cap: float
    current_rent: float
    target_rent: float
    invest_monthly: float
    leftover_monthly: float
    gap: float
    cash_needed_for_runway: float
    months_until_ready: float
    assumptions: list[str]


class CalendarEvent(BaseModel):
    date: str
    title: str
    amount: float
    kind: str


class GeminiTrace(BaseModel):
    configured: bool = False
    categorizer: str = "rules"
    advisor: str = "rules"
    model: str = "gemini-2.5-flash"
    error: str | None = None


class Advice(BaseModel):
    summary: str
    actions: list[str] = Field(min_length=1, max_length=5)


class CreateSessionRequest(BaseModel):
    mode: Literal["live", "demo"] = "demo"
    gemini_api_key: str | None = None


class GeminiKeyRequest(BaseModel):
    api_key: str


class CreateSessionResponse(BaseModel):
    session_id: str
    status: str
    mode: str


class IngestRequest(BaseModel):
    csv_text: str | None = None
    ask_demo: bool = False


class IngestResponse(BaseModel):
    txn_count: int
    ingest_status: str


class MessageRequest(BaseModel):
    text: str


class SessionResponse(BaseModel):
    session_id: str
    status: str
    mode: str
    disclaimer: str = Disclaimer
    profile: Profile | None = None
    budget: BudgetSnapshot | None = None
    scenario: ScenarioResult | None = None
    advice: Advice | None = None
    workbook_url: str | None = None
    workbook_id: str | None = None
    txn_count: int = 0
    last_error: str | None = None
    messages: list[dict] = Field(default_factory=list)
    calendar: list[CalendarEvent] = Field(default_factory=list)
    gemini: GeminiTrace = Field(default_factory=GeminiTrace)
    google_sheet_url: str | None = None
    html_workbook_url: str | None = None
