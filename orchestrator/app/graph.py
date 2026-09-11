from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv

from app.engines.budget import build_budget
from app.engines.scenario import run_scenario
from app.integrations.bank import DEMO_CASH_ON_HAND, demo_calendar, demo_transactions
from app.integrations.gemini import advise, categorize_transactions, configured, last_error
from app.integrations.html_workbook import write_html
from app.integrations.spreadsheet import write_workbook
from app.models import (
    Advice,
    BudgetSnapshot,
    CalendarEvent,
    GeminiTrace,
    IngestResponse,
    Profile,
    ScenarioResult,
    SessionResponse,
    Transaction,
)

DEFAULT_QUESTION = (
    "Can I afford a $1,450 apartment while investing $200/month?"
)


@dataclass
class Session:
    session_id: str
    mode: str
    status: str = "created"
    profile: Profile | None = None
    transactions: list[Transaction] = field(default_factory=list)
    budget: BudgetSnapshot | None = None
    scenario: ScenarioResult | None = None
    advice: Advice | None = None
    workbook_id: str | None = None
    cash_on_hand: float = DEMO_CASH_ON_HAND
    last_error: str | None = None
    messages: list[dict] = field(default_factory=list)
    calendar: list[CalendarEvent] = field(default_factory=list)
    categorizer: str = "rules"
    advisor: str = "rules"


class Orchestrator:
    def __init__(self, public_base_url: str, workbook_dir: Path) -> None:
        self.public_base_url = public_base_url.rstrip("/")
        self.workbook_dir = workbook_dir
        self.workbook_dir.mkdir(parents=True, exist_ok=True)
        self.sessions: dict[str, Session] = {}

    def create_session(self, mode: str) -> Session:
        session = Session(session_id=uuid4().hex[:12], mode=mode, status="created")
        if mode == "demo":
            session.profile = Profile()
        self.sessions[session.session_id] = session
        return session

    def get(self, session_id: str) -> Session:
        session = self.sessions.get(session_id)
        if session is None:
            raise KeyError(session_id)
        return session

    def set_profile(self, session_id: str, profile: Profile) -> Session:
        session = self.get(session_id)
        session.profile = profile
        session.status = "profiled"
        return session

    def ingest(self, session_id: str, ask_demo: bool = True) -> IngestResponse:
        session = self.get(session_id)
        if session.profile is None:
            session.profile = Profile()
        session.status = "ingesting"
        session.transactions, session.categorizer = categorize_transactions(demo_transactions())
        session.calendar = [CalendarEvent(**item) for item in demo_calendar()]
        session.cash_on_hand = DEMO_CASH_ON_HAND
        session.budget = build_budget(session.profile, session.transactions, session.cash_on_hand)
        session.workbook_id = session.workbook_id or f"wb_{session.session_id}"
        session.messages.append(
            {
                "role": "multiply",
                "text": (
                    f"Budget is ready from {len(session.transactions)} transactions "
                    f"({session.categorizer}). Take-home is about "
                    f"${session.budget.income_monthly:,.0f}/mo with "
                    f"${session.budget.surplus_monthly:,.0f} surplus before investing."
                ),
            }
        )
        if ask_demo:
            self.ask(session_id, DEFAULT_QUESTION)
        else:
            self._write_sheet(session)
            session.status = "ready"
        return IngestResponse(txn_count=len(session.transactions), ingest_status="ready")

    def ask(self, session_id: str, question: str) -> Session:
        session = self.get(session_id)
        if session.profile is None or session.budget is None:
            self.ingest(session_id, ask_demo=False)
            session = self.get(session_id)
        assert session.profile is not None
        assert session.budget is not None
        text = question.strip() or DEFAULT_QUESTION
        session.scenario = run_scenario(text, session.profile, session.budget, session.transactions)
        session.advice, session.advisor = advise(text, session.profile, session.budget, session.scenario)
        session.messages.append({"role": "user", "text": text})
        session.messages.append(
            {
                "role": "multiply",
                "text": session.advice.summary,
                "actions": session.advice.actions,
            }
        )
        self._write_sheet(session)
        session.status = "ready"
        session.last_error = last_error()
        return session

    def _write_sheet(self, session: Session) -> None:
        if session.workbook_id is None or session.budget is None:
            return
        xlsx = self.workbook_dir / f"{session.workbook_id}.xlsx"
        html = self.workbook_dir / f"{session.workbook_id}.html"
        write_workbook(xlsx, session.transactions, session.budget, session.scenario)
        write_html(html, session.transactions, session.budget, session.scenario, session.calendar)

    def workbook_url(self, session: Session, suffix: str) -> str | None:
        if not session.workbook_id:
            return None
        return f"{self.public_base_url}/v1/workbooks/{session.workbook_id}{suffix}"

    def gemini_trace(self, session: Session) -> GeminiTrace:
        from app.integrations.gemini import _model

        return GeminiTrace(
            configured=configured(),
            categorizer=session.categorizer,
            advisor=session.advisor,
            model=_model(),
            error=session.last_error or last_error(),
        )

    def to_response(self, session: Session) -> SessionResponse:
        load_dotenv(Path(__file__).resolve().parents[1] / ".env")
        return SessionResponse(
            session_id=session.session_id,
            status=session.status,
            mode=session.mode,
            profile=session.profile,
            budget=session.budget,
            scenario=session.scenario,
            advice=session.advice,
            workbook_url=self.workbook_url(session, ".xlsx"),
            workbook_id=session.workbook_id,
            txn_count=len(session.transactions),
            last_error=session.last_error,
            messages=session.messages,
            calendar=session.calendar,
            gemini=self.gemini_trace(session),
            google_sheet_url=os.getenv("GOOGLE_SHEET_URL") or None,
            html_workbook_url=self.workbook_url(session, ".html"),
        )


def build_orchestrator() -> Orchestrator:
    base = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")
    directory = Path(os.getenv("WORKBOOK_DIR", "storage/workbooks"))
    return Orchestrator(public_base_url=base, workbook_dir=directory)
