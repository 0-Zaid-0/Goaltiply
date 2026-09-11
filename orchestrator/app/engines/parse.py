from __future__ import annotations

import re
from dataclasses import dataclass

Intent = str

HOUSING_HINTS = ("apartment", "rent", "lease", "move", "moving", "housing", "studio", "1br", "one bedroom")
TIMELINE_HINTS = ("when can", "how long", "how soon", "until i", "how many months", "timeline")
INVEST_HINTS = ("invest", "etf", "index fund", "roth", "401k", "brokerage", "vti")
SPENDING_HINTS = (
    "where is my money",
    "where does my money",
    "spending",
    "subscription",
    "netflix",
    "spotify",
    "groceries",
    "budget breakdown",
    "what am i spending",
)
RUNWAY_HINTS = ("emergency", "runway", "cash buffer", "save up", "savings")

MONEY_RE = re.compile(r"\$\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)")


@dataclass(frozen=True)
class ParsedQuestion:
    intent: Intent
    rent: float | None = None
    invest: float | None = None
    raw: str = ""


def _has(text: str, hints: tuple[str, ...]) -> bool:
    return any(hint in text for hint in hints)


def _amounts(text: str) -> list[tuple[int, float]]:
    found: list[tuple[int, float]] = []
    for match in MONEY_RE.finditer(text):
        end = match.end()
        if end < len(text) and text[end].lower() in "kmb":
            continue
        found.append((match.start(), float(match.group(1).replace(",", ""))))
    return found


def _near(text: str, keywords: tuple[str, ...], amounts: list[tuple[int, float]], low: float, high: float) -> float | None:
    for keyword in keywords:
        for hit in re.finditer(re.escape(keyword), text):
            for pos, value in amounts:
                if value < low or value > high:
                    continue
                after = pos - hit.end()
                before = hit.start() - pos
                if 0 <= after <= 48 or 0 <= before <= 24:
                    return value
    for _, value in amounts:
        if low <= value <= high:
            return value
    return None


def parse_question(question: str) -> ParsedQuestion:
    text = question.lower().strip()
    amounts = _amounts(text)
    rent = _near(text, ("rent", "apartment", "lease", "studio"), amounts, 400, 6000)
    invest = _near(text, ("invest", "investing", "etf"), amounts, 25, 399)

    if _has(text, SPENDING_HINTS) and not _has(text, HOUSING_HINTS):
        intent: Intent = "spending"
    elif _has(text, TIMELINE_HINTS) or text.startswith("when"):
        intent = "timeline"
    elif _has(text, HOUSING_HINTS) or ("afford" in text and rent is not None):
        intent = "housing"
    elif _has(text, INVEST_HINTS):
        intent = "invest"
    elif _has(text, RUNWAY_HINTS):
        intent = "runway"
    else:
        intent = "general"
    return ParsedQuestion(intent=intent, rent=rent, invest=invest, raw=question)
