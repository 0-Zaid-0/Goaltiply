from __future__ import annotations

from app.models import Transaction

RULES: list[tuple[str, str, bool]] = [
    ("direct dep", "Income", True),
    ("payroll", "Income", True),
    ("austin tech", "Income", True),
    ("sunset commons", "Housing", True),
    ("apartments", "Housing", True),
    ("rent", "Housing", True),
    ("spotify", "Subscriptions", True),
    ("netflix", "Subscriptions", True),
    ("hulu", "Subscriptions", True),
    ("planet fitness", "Subscriptions", True),
    ("apple.com/bill", "Subscriptions", True),
    ("icloud", "Subscriptions", True),
    ("trader joe", "Groceries", False),
    ("heb", "Groceries", False),
    ("whole foods", "Groceries", False),
    ("aldi", "Groceries", False),
    ("starbucks", "Dining", False),
    ("chipotle", "Dining", False),
    ("sweetgreen", "Dining", False),
    ("doordash", "Dining", False),
    ("uber eats", "Dining", False),
    ("uber", "Transport", False),
    ("lyft", "Transport", False),
    ("capmetro", "Transport", True),
    ("shell", "Transport", False),
    ("chevron", "Transport", False),
    ("austin energy", "Utilities", True),
    ("at&t", "Utilities", True),
    ("t-mobile", "Utilities", True),
    ("google fiber", "Utilities", True),
    ("nelnet", "Debt", True),
    ("navient", "Debt", True),
    ("student ln", "Debt", True),
    ("amazon", "Shopping", False),
    ("target", "Shopping", False),
    ("ikea", "Shopping", False),
    ("cvs", "Health", False),
    ("walgreens", "Health", False),
    ("venmo", "Transfers", False),
    ("zelle", "Transfers", False),
]


def categorize_rules(transactions: list[Transaction]) -> list[Transaction]:
    categorized: list[Transaction] = []
    for txn in transactions:
        blob = f"{txn.merchant} {txn.memo}".lower()
        category = "Uncategorized"
        recurring = False
        if txn.amount > 0:
            category, recurring = "Income", True
        else:
            for needle, label, is_recurring in RULES:
                if needle in blob:
                    category, recurring = label, is_recurring
                    break
        categorized.append(
            txn.model_copy(
                update={
                    "category": category,
                    "is_recurring": recurring or txn.is_recurring,
                    "confidence": 0.93 if category != "Uncategorized" else 0.4,
                }
            )
        )
    return categorized
