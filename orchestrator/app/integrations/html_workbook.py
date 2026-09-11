from __future__ import annotations

from html import escape
from pathlib import Path

from app.models import BudgetSnapshot, CalendarEvent, ScenarioResult, Transaction


def write_html(
    path: Path,
    transactions: list[Transaction],
    budget: BudgetSnapshot,
    scenario: ScenarioResult | None,
    calendar: list[CalendarEvent],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    cats = "".join(
        f"<tr><td>{escape(item.name)}</td><td>${item.amount:,.2f}</td></tr>"
        for item in budget.categories
    )
    tx_rows = "".join(
        f"<tr><td>{escape(txn.date)}</td><td>{escape(txn.merchant)}</td>"
        f"<td>${txn.amount:,.2f}</td><td>{escape(txn.category or '')}</td></tr>"
        for txn in sorted(transactions, key=lambda item: item.date, reverse=True)[:40]
    )
    bills = "".join(
        f"<tr><td>{escape(event.date)}</td><td>{escape(event.title)}</td>"
        f"<td>${event.amount:,.2f}</td><td>{escape(event.kind)}</td></tr>"
        for event in calendar
    )
    scene = "<p>No scenario yet.</p>"
    if scenario:
        scene = (
            f"<p><b>{escape(scenario.headline)}</b> — {escape(scenario.question)}</p>"
            f"<p>Target rent ${scenario.target_rent:,.0f} · cap ${scenario.rent_cap:,.0f} · "
            f"runway {scenario.runway_months:.1f} months</p>"
        )
    path.write_text(
        f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>MultiPly budget</title>
<style>
body{{font-family:Georgia,serif;background:#f3eee4;color:#1c1917;margin:32px}}
table{{border-collapse:collapse;width:100%;background:#fffaf2}}
td,th{{border:1px solid #d9d0c1;padding:8px;text-align:left}}
th{{background:#0f3d2e;color:#fff}}
h1{{font-weight:500}}
.fine{{color:#6b6458;font-size:13px}}
</style></head><body>
<h1>MultiPly budget</h1>
<p class="fine">Educational simulation, not financial advice.</p>
<h2>Overview</h2>
<table>
<tr><th>Metric</th><th>Amount</th></tr>
<tr><td>Take-home</td><td>${budget.income_monthly:,.2f}</td></tr>
<tr><td>Spending</td><td>${budget.burn_monthly:,.2f}</td></tr>
<tr><td>Surplus</td><td>${budget.surplus_monthly:,.2f}</td></tr>
<tr><td>Cash</td><td>${budget.cash_on_hand:,.2f}</td></tr>
</table>
<h2>Scenario</h2>
{scene}
<h2>Budget</h2>
<table><tr><th>Category</th><th>Monthly</th></tr>{cats}</table>
<h2>Calendar MCP — upcoming</h2>
<table><tr><th>Date</th><th>Title</th><th>Amount</th><th>Kind</th></tr>{bills}</table>
<h2>Transactions (latest 40)</h2>
<table><tr><th>Date</th><th>Merchant</th><th>Amount</th><th>Category</th></tr>{tx_rows}</table>
</body></html>
""",
        encoding="utf-8",
    )
