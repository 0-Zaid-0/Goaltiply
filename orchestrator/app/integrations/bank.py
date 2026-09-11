from __future__ import annotations

from datetime import date, timedelta

from app.models import Transaction

DEMO_CASH_ON_HAND = 4_200.0
EMPLOYER = "AUSTIN TECH LLC PAYROLL"
LANDLORD = "SUNSET COMMONS APTS"


def demo_transactions(as_of: date | None = None) -> list[Transaction]:
    """90 days of a 24-year-old on $50k in Austin, roommate rent, lifestyle creep."""
    as_of = as_of or date(2026, 9, 11)
    start = as_of - timedelta(days=90)
    rows: list[Transaction] = []
    n = 0

    def add(day: date, merchant: str, amount: float, memo: str = "") -> None:
        nonlocal n
        if day < start or day > as_of:
            return
        n += 1
        rows.append(
            Transaction(
                txn_id=f"txn_{n:04d}",
                date=day.isoformat(),
                merchant=merchant,
                amount=round(amount, 2),
                memo=memo,
            )
        )

    cursor = date(start.year, start.month, 1)
    while cursor <= as_of:
        # Paydays: 1st and 15th. $50k * 0.78 / 12 ≈ $3,250/month.
        add(date(cursor.year, cursor.month, 1), EMPLOYER, 1625.00, "DIRECT DEP")
        add(date(cursor.year, cursor.month, 15), EMPLOYER, 1625.00, "DIRECT DEP")
        add(date(cursor.year, cursor.month, 1), LANDLORD, -1050.00, "RENT")
        add(date(cursor.year, cursor.month, 3), "GOOGLE FIBER", -65.00, "INTERNET")
        add(date(cursor.year, cursor.month, 5), "AUSTIN ENERGY", -58.00 if cursor.month % 2 else -71.00)
        add(date(cursor.year, cursor.month, 6), "T-MOBILE", -45.00)
        add(date(cursor.year, cursor.month, 7), "SPOTIFY", -11.99)
        add(date(cursor.year, cursor.month, 8), "NETFLIX.COM", -15.49)
        add(date(cursor.year, cursor.month, 9), "PLANET FITNESS", -15.00)
        add(date(cursor.year, cursor.month, 10), "APPLE.COM/BILL", -9.99, "ICLOUD+")
        add(date(cursor.year, cursor.month, 12), "NELNET STUDENT LN", -210.00)
        if cursor.month < 12:
            cursor = date(cursor.year, cursor.month + 1, 1)
        else:
            cursor = date(cursor.year + 1, 1, 1)

    day = start
    while day <= as_of:
        weekday = day.weekday()
        if weekday == 6:
            add(day, "HEB #412", -72.40 if day.day < 16 else -81.15, "GROCERIES")
        if weekday == 1:
            add(day, "STARBUCKS", -6.25)
        if weekday == 3:
            add(day, "CHIPOTLE 1842", -13.80)
        if weekday == 4 and day.day % 14 < 7:
            add(day, "UBER * TRIP", -18.40)
        if day.day == 18:
            add(day, "AMAZON.COM", -34.67)
        if day.day == 22:
            add(day, "TARGET T-2144", -28.19)
        if day.day == 27 and day.month % 2 == 0:
            add(day, "CVS/PHARMACY", -16.48)
        day += timedelta(days=1)

    rows.sort(key=lambda txn: (txn.date, txn.txn_id))
    for index, txn in enumerate(rows, start=1):
        txn.txn_id = f"txn_{index:04d}"
    return rows


def demo_calendar(as_of: date | None = None) -> list[dict]:
    """Upcoming bills the Calendar MCP would return for the next 45 days."""
    as_of = as_of or date(2026, 9, 11)
    horizon = as_of + timedelta(days=45)
    specs = [
        (1, "Sunset Commons rent", 1050.0, "bill"),
        (3, "Google Fiber", 65.0, "bill"),
        (5, "Austin Energy", 64.0, "bill"),
        (6, "T-Mobile", 45.0, "bill"),
        (12, "Nelnet student loan", 210.0, "bill"),
        (1, "Payroll — Austin Tech", 1625.0, "payday"),
        (15, "Payroll — Austin Tech", 1625.0, "payday"),
    ]
    events: list[dict] = []
    cursor = date(as_of.year, as_of.month, 1)
    while cursor <= horizon:
        for day_n, title, amount, kind in specs:
            try:
                when = date(cursor.year, cursor.month, day_n)
            except ValueError:
                continue
            if as_of <= when <= horizon:
                events.append(
                    {
                        "date": when.isoformat(),
                        "title": title,
                        "amount": amount,
                        "kind": kind,
                    }
                )
        if cursor.month == 12:
            cursor = date(cursor.year + 1, 1, 1)
        else:
            cursor = date(cursor.year, cursor.month + 1, 1)
    events.sort(key=lambda item: item["date"])
    return events
