from __future__ import annotations

from collections import defaultdict

from app.models import BudgetSnapshot, CategoryTotal, Profile, Transaction

INCOME_CATEGORIES = {"Income"}
TRANSFER_CATEGORIES = {"Transfers", "Savings", "Investing"}


def income_monthly(profile: Profile) -> float:
    return round(profile.income_annual / 12 * profile.net_income_factor, 2)


def build_budget(
    profile: Profile,
    transactions: list[Transaction],
    cash_on_hand: float,
) -> BudgetSnapshot:
    by_category: dict[str, float] = defaultdict(float)
    for txn in transactions:
        category = txn.category or "Uncategorized"
        if category in INCOME_CATEGORIES or category in TRANSFER_CATEGORIES:
            continue
        # Expenses are stored as negative amounts in the ledger.
        if txn.amount < 0:
            by_category[category] += abs(txn.amount)

    # Fixture spans ~90 days; normalize to a monthly run-rate.
    days = _span_days(transactions) or 90
    month_factor = 30.0 / days
    categories = [
        CategoryTotal(name=name, amount=round(amount * month_factor, 2))
        for name, amount in sorted(by_category.items(), key=lambda item: item[1], reverse=True)
    ]
    burn = round(sum(item.amount for item in categories), 2)
    income = income_monthly(profile)
    return BudgetSnapshot(
        income_monthly=income,
        burn_monthly=burn,
        surplus_monthly=round(income - burn, 2),
        invest_monthly=profile.invest_monthly,
        cash_on_hand=round(cash_on_hand, 2),
        categories=categories,
    )


def _span_days(transactions: list[Transaction]) -> int:
    dates = [txn.date for txn in transactions if txn.date]
    if not dates:
        return 90
    return max(( _ordinal(max(dates)) - _ordinal(min(dates)) ), 1)


def _ordinal(value: str) -> int:
    year, month, day = (int(part) for part in value.split("-"))
    return year * 372 + month * 31 + day
