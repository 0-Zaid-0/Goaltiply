from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Literal

from app.engines.advise import fallback_advice
from app.engines.categorize import categorize_rules
from app.models import Advice, BudgetSnapshot, Profile, ScenarioResult, Transaction

CATEGORIES = [
    "Income",
    "Housing",
    "Groceries",
    "Dining",
    "Transport",
    "Subscriptions",
    "Utilities",
    "Debt",
    "Shopping",
    "Health",
    "Transfers",
    "Uncategorized",
]

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
Source = Literal["gemini", "rules"]
_last_error: str | None = None


def _api_key() -> str:
    return (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()


def configured() -> bool:
    return bool(_api_key())


def last_error() -> str | None:
    return _last_error


def _model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def _client():
    key = _api_key()
    if not key:
        return None
    from google import genai

    return genai.Client(api_key=key)


def persist_api_key(key: str) -> None:
    token = key.strip()
    if not token:
        raise ValueError("empty key")
    os.environ["GEMINI_API_KEY"] = token
    existing = ENV_PATH.read_text() if ENV_PATH.exists() else ""
    lines = [line for line in existing.splitlines() if not line.startswith("GEMINI_API_KEY=")]
    lines.append(f"GEMINI_API_KEY={token}")
    if not any(line.startswith("GEMINI_MODEL=") for line in lines):
        lines.append("GEMINI_MODEL=gemini-2.5-flash")
    ENV_PATH.write_text("\n".join(lines) + "\n")


def ping() -> dict[str, Any]:
    global _last_error
    client = _client()
    if client is None:
        _last_error = "No GEMINI_API_KEY"
        return {"configured": False, "verified": False, "model": _model(), "error": _last_error}
    try:
        response = client.models.generate_content(
            model=_model(),
            contents="Reply with exactly OK",
        )
        text = (response.text or "").strip()
        ok = "OK" in text.upper()
        _last_error = None if ok else f"Unexpected ping: {text[:80]}"
        return {"configured": True, "verified": ok, "model": _model(), "error": _last_error}
    except Exception as exc:
        _last_error = str(exc)[:240]
        return {"configured": True, "verified": False, "model": _model(), "error": _last_error}


def categorize_transactions(transactions: list[Transaction]) -> tuple[list[Transaction], Source]:
    global _last_error
    client = _client()
    if client is None:
        return categorize_rules(transactions), "rules"
    payload = [
        {
            "txn_id": txn.txn_id,
            "merchant": txn.merchant,
            "amount": txn.amount,
            "memo": txn.memo,
        }
        for txn in transactions
    ]
    prompt = (
        "Categorize these bank transactions for a young-adult budget. "
        f"Allowed categories: {', '.join(CATEGORIES)}. "
        "Income is positive. Expenses are negative. "
        "Return JSON: {\"items\": [{\"txn_id\": str, \"category\": str, "
        "\"is_recurring\": bool, \"confidence\": number}]}. "
        "Use Uncategorized when unsure.\n\n"
        f"{json.dumps(payload)}"
    )
    try:
        response = client.models.generate_content(
            model=_model(),
            contents=prompt,
            config={"response_mime_type": "application/json", "temperature": 0},
        )
        parsed = json.loads(response.text or "{}")
        by_id = {item["txn_id"]: item for item in parsed.get("items", [])}
        if not by_id:
            raise ValueError("empty Gemini category payload")
        merged: list[Transaction] = []
        for txn in transactions:
            item = by_id.get(txn.txn_id)
            if not item:
                merged.extend(categorize_rules([txn]))
                continue
            category = item.get("category") if item.get("category") in CATEGORIES else "Uncategorized"
            merged.append(
                txn.model_copy(
                    update={
                        "category": category,
                        "is_recurring": bool(item.get("is_recurring", False)),
                        "confidence": float(item.get("confidence", 0.7)),
                    }
                )
            )
        _last_error = None
        return merged, "gemini"
    except Exception as exc:
        _last_error = str(exc)[:240]
        return categorize_rules(transactions), "rules"


def advise(
    question: str,
    profile: Profile,
    budget: BudgetSnapshot,
    scenario: ScenarioResult,
) -> tuple[Advice, Source]:
    global _last_error
    fallback = fallback_advice(profile, budget, scenario)
    client = _client()
    if client is None:
        return fallback, "rules"
    context: dict[str, Any] = {
        "question": question,
        "intent": scenario.intent,
        "profile": profile.model_dump(),
        "budget": budget.model_dump(),
        "scenario": scenario.model_dump(),
        "rule": (
            "Answer THIS question only. Do not reuse an apartment paragraph unless intent is housing. "
            "Do not contradict scenario.affordable. Do not change numbers."
        ),
    }
    prompt = (
        "You are MultiPly, an educational financial literacy copilot for a Google AI hackathon. "
        "Write a short summary that would be wrong if the question were different. "
        "Return JSON {\"summary\": str, \"actions\": [str, str, str]}.\n\n"
        f"{json.dumps(context, default=str)}"
    )
    try:
        response = client.models.generate_content(
            model=_model(),
            contents=prompt,
            config={"response_mime_type": "application/json", "temperature": 0.4},
        )
        parsed = json.loads(response.text or "{}")
        actions = [str(item) for item in parsed.get("actions", [])][:3]
        summary = str(parsed.get("summary") or "").strip()
        if not summary or len(actions) < 3:
            raise ValueError("incomplete Gemini advice")
        _last_error = None
        return Advice(summary=summary, actions=actions), "gemini"
    except Exception as exc:
        _last_error = str(exc)[:240]
        return fallback, "rules"
