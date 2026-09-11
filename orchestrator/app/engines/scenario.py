from __future__ import annotations

from app.engines.budget import income_monthly
from app.engines.parse import parse_question
from app.models import BudgetSnapshot, Profile, ScenarioResult, Transaction

RENT_SHARE_OF_TAKEHOME = 0.30
RUNWAY_MONTHS_REQUIRED = 3.0


def current_rent(transactions: list[Transaction]) -> float:
    rents = [
        abs(txn.amount)
        for txn in transactions
        if (txn.category == "Housing") and txn.amount < 0 and txn.is_recurring
    ]
    if not rents:
        return 0.0
    return round(sum(rents) / max(len(rents), 1), 2)


def category_amount(budget: BudgetSnapshot, name: str) -> float:
    for item in budget.categories:
        if item.name == name:
            return item.amount
    return 0.0


def run_scenario(
    question: str,
    profile: Profile,
    budget: BudgetSnapshot,
    transactions: list[Transaction],
) -> ScenarioResult:
    parsed = parse_question(question)
    takehome = income_monthly(profile)
    rent_cap = round(takehome * RENT_SHARE_OF_TAKEHOME, 2)
    present_rent = current_rent(transactions)
    target = parsed.rent if parsed.rent is not None else profile.target_rent
    invest = parsed.invest if parsed.invest is not None else profile.invest_monthly
    rent_delta = target - present_rent
    leftover = round(budget.surplus_monthly - invest - rent_delta, 2)
    new_burn = max(budget.burn_monthly + rent_delta + invest, 1.0)
    runway = round(budget.cash_on_hand / new_burn, 2)
    cash_needed = round(max(RUNWAY_MONTHS_REQUIRED * new_burn - budget.cash_on_hand, 0), 2)
    rent_gap = round(max(target - rent_cap, 0), 2)
    cashflow_gap = round(max(-leftover, 0), 2)
    gap = round(max(rent_gap, cashflow_gap, cash_needed), 2)
    housing_ok = leftover >= 0 and runway >= RUNWAY_MONTHS_REQUIRED and target <= rent_cap
    monthly_save = max(budget.surplus_monthly - invest, 1.0)
    months = round(cash_needed / monthly_save, 1)

    if parsed.intent == "housing":
        headline = "Affordable" if housing_ok else "Not yet"
        affordable = housing_ok
    elif parsed.intent == "invest":
        leftover_if_invest = round(budget.surplus_monthly - invest, 2)
        affordable = leftover_if_invest >= 0
        headline = "Investing fits" if affordable else "Investing is tight"
        leftover = leftover_if_invest
        gap = round(max(-leftover_if_invest, 0), 2)
    elif parsed.intent == "spending":
        affordable = True
        headline = "Spending map"
        gap = 0
    elif parsed.intent == "timeline":
        affordable = housing_ok
        headline = "Move timeline"
    elif parsed.intent == "runway":
        affordable = budget.cash_on_hand / max(budget.burn_monthly, 1) >= RUNWAY_MONTHS_REQUIRED
        headline = "Runway check"
        runway = round(budget.cash_on_hand / max(budget.burn_monthly, 1), 2)
        cash_needed = round(max(RUNWAY_MONTHS_REQUIRED * budget.burn_monthly - budget.cash_on_hand, 0), 2)
        gap = cash_needed
        months = round(cash_needed / monthly_save, 1)
    else:
        affordable = housing_ok
        headline = "Budget snapshot"

    return ScenarioResult(
        question=question,
        intent=parsed.intent,
        headline=headline,
        affordable=affordable,
        runway_months=runway,
        rent_cap=rent_cap,
        current_rent=present_rent,
        target_rent=target,
        invest_monthly=invest,
        leftover_monthly=leftover,
        gap=gap,
        cash_needed_for_runway=cash_needed,
        months_until_ready=months,
        assumptions=[
            f"Intent classified as {parsed.intent}",
            f"Rent cap is {int(RENT_SHARE_OF_TAKEHOME * 100)}% of take-home (${rent_cap:,.0f})",
            f"{RUNWAY_MONTHS_REQUIRED:.0f}-month cash runway at the modeled spend",
            f"${invest:.0f}/month investing is treated as committed for this question",
            "Federal/state tax approximated with a 22% haircut on gross pay",
        ],
    )
