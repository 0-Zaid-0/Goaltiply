from __future__ import annotations

from app.engines.scenario import category_amount
from app.models import Advice, BudgetSnapshot, Profile, ScenarioResult


def fallback_advice(
    profile: Profile,
    budget: BudgetSnapshot,
    scenario: ScenarioResult,
) -> Advice:
    intent = scenario.intent
    if intent == "spending":
        return _spending(budget)
    if intent == "invest":
        return _invest(profile, budget, scenario)
    if intent == "timeline":
        return _timeline(profile, scenario)
    if intent == "runway":
        return _runway(budget, scenario)
    if intent == "housing":
        return _housing(profile, budget, scenario)
    return _general(profile, budget, scenario)


def _housing(profile: Profile, budget: BudgetSnapshot, scenario: ScenarioResult) -> Advice:
    if scenario.affordable:
        summary = (
            f"Yes — ${scenario.target_rent:,.0f} rent plus ${scenario.invest_monthly:.0f}/month "
            f"investing fits {profile.location} take-home. Cap is ${scenario.rent_cap:,.0f} and "
            f"you still keep about ${scenario.leftover_monthly:,.0f}/month."
        )
        actions = [
            f"Keep the lease at or under ${scenario.rent_cap:,.0f}",
            f"Automate ${scenario.invest_monthly:.0f}/month on payday",
            "Re-run this when you have the actual lease number",
        ]
    else:
        parts = []
        if scenario.target_rent > scenario.rent_cap:
            parts.append(
                f"${scenario.target_rent:,.0f} rent is "
                f"${scenario.target_rent - scenario.rent_cap:,.0f} over the "
                f"${scenario.rent_cap:,.0f} cap"
            )
        if scenario.runway_months < 3:
            parts.append(
                f"runway would be {scenario.runway_months:.1f} months "
                f"(need ~${scenario.cash_needed_for_runway:,.0f} more cash)"
            )
        if scenario.leftover_monthly < 0:
            parts.append(f"cash flow short by ${abs(scenario.leftover_monthly):,.0f}/month")
        reason = "; ".join(parts) or "the housing checks fail"
        summary = (
            f"Not at ${scenario.target_rent:,.0f}. {reason[0].upper() + reason[1:]}. "
            f"You currently pay ${scenario.current_rent:,.0f}."
        )
        actions = [
            f"Search at or under ${scenario.rent_cap:,.0f}, or keep a roommate",
            f"Ask again with a different rent, e.g. “what if rent is ${scenario.rent_cap:,.0f}?”",
            f"Keep investing ${scenario.invest_monthly:.0f} unless a payment would bounce",
        ]
    return Advice(summary=summary, actions=actions[:3])


def _timeline(profile: Profile, scenario: ScenarioResult) -> Advice:
    if scenario.target_rent > scenario.rent_cap:
        summary = (
            f"Waiting does not fix a ${scenario.target_rent:,.0f} rent on "
            f"${profile.income_annual:,.0f}/year. The cap stays ${scenario.rent_cap:,.0f} "
            f"until income rises. Saving ~{scenario.months_until_ready:.0f} months only "
            f"builds the 3-month cash cushion, not the rent-to-income ratio."
        )
        actions = [
            f"Price {profile.location} listings at ${scenario.rent_cap:,.0f} or keep a roommate",
            "Raise take-home before signing a lease above the cap",
            f"Keep the ${scenario.invest_monthly:.0f}/month invest while you wait",
        ]
    elif scenario.affordable:
        summary = (
            f"You can move on this income if rent stays ≤ ${scenario.rent_cap:,.0f}. "
            f"No extra wait required for the ratio; still keep 3 months of cash."
        )
        actions = [
            "Tour places at the cap this month",
            "Do not stretch to the old $1,450 target",
            "Hold the investing transfer on payday",
        ]
    else:
        summary = (
            f"If rent is ${scenario.target_rent:,.0f} (under the ${scenario.rent_cap:,.0f} cap), "
            f"you still need about {scenario.months_until_ready:.0f} months of saving to hit "
            f"a 3-month runway (~${scenario.cash_needed_for_runway:,.0f})."
        )
        actions = [
            f"Park ${max(scenario.leftover_monthly, 0):,.0f}/mo in a high-yield savings account",
            "Revisit the move date after the cash target hits",
            "Do not pause investing to speed this up unless rent would bounce",
        ]
    return Advice(summary=summary, actions=actions[:3])


def _invest(profile: Profile, budget: BudgetSnapshot, scenario: ScenarioResult) -> Advice:
    leftover = round(budget.surplus_monthly - scenario.invest_monthly, 2)
    if leftover >= 0:
        summary = (
            f"Yes — ${scenario.invest_monthly:.0f}/month investing fits today’s surplus "
            f"of ${budget.surplus_monthly:,.0f}. You would still have about "
            f"${leftover:,.0f}/month. That is separate from the ${scenario.target_rent:,.0f} "
            f"apartment, which still fails a 30% rent cap."
        )
        actions = [
            f"Set a ${scenario.invest_monthly:.0f} auto-transfer to a low-cost index fund on payday",
            "Use a taxable brokerage or Roth IRA — this is literacy, not a product pick",
            "Do not raise investing until the 3-month cash runway exists",
        ]
    else:
        summary = (
            f"${scenario.invest_monthly:.0f}/month is ${abs(leftover):,.0f} more than leftover "
            f"cash flow (${budget.surplus_monthly:,.0f} surplus). Cut that invest amount or cut spend first."
        )
        actions = [
            f"Drop the invest target to ${max(budget.surplus_monthly, 0):,.0f} or less",
            "Kill a subscription if you want the extra room",
            "Build the cash buffer before increasing the transfer",
        ]
    return Advice(summary=summary, actions=actions[:3])


def _spending(budget: BudgetSnapshot) -> Advice:
    top = budget.categories[:3]
    named = ", ".join(f"{item.name} ${item.amount:,.0f}" for item in top) or "a few small categories"
    subs = category_amount(budget, "Subscriptions")
    dining = category_amount(budget, "Dining")
    summary = (
        f"Monthly spend is about ${budget.burn_monthly:,.0f} against "
        f"${budget.income_monthly:,.0f} take-home (${budget.surplus_monthly:,.0f} surplus). "
        f"Largest buckets: {named}. Subscriptions run ~${subs:,.0f}; dining ~${dining:,.0f}."
    )
    actions = [
        f"Audit subscriptions (~${subs:,.0f}/mo) before touching groceries or rent",
        f"If dining (${dining:,.0f}) is the leak, cap it for 30 days and rerun this",
        "Keep the surplus parked until you pick a goal — move vs invest",
    ]
    return Advice(summary=summary, actions=actions[:3])


def _runway(budget: BudgetSnapshot, scenario: ScenarioResult) -> Advice:
    current = round(budget.cash_on_hand / max(budget.burn_monthly, 1), 1)
    if current >= 3:
        summary = (
            f"Cash on hand is ${budget.cash_on_hand:,.0f}, about {current:.1f} months of "
            f"current spend (${budget.burn_monthly:,.0f}). That clears a 3-month emergency fund."
        )
        actions = [
            "Keep the fund in a high-yield savings account",
            "Do not drain it for a lease deposit unless you rebuild it the same quarter",
            f"Surplus of ${budget.surplus_monthly:,.0f}/mo can go to investing after the fund is stable",
        ]
    else:
        summary = (
            f"Cash is ${budget.cash_on_hand:,.0f} — only {current:.1f} months of current spend. "
            f"You still need about ${scenario.cash_needed_for_runway:,.0f} "
            f"(~{scenario.months_until_ready:.0f} months of surplus) to hit 3 months."
        )
        actions = [
            f"Sweep ${max(budget.surplus_monthly - budget.invest_monthly, 0):,.0f}/mo into savings first",
            "Pause lifestyle upgrades until the fund hits 3 months",
            "Keep investing only if the transfer would not delay the fund past a year",
        ]
    return Advice(summary=summary, actions=actions[:3])


def _general(profile: Profile, budget: BudgetSnapshot, scenario: ScenarioResult) -> Advice:
    summary = (
        f"On ${profile.income_annual:,.0f}/year in {profile.location} you take home about "
        f"${budget.income_monthly:,.0f}/mo, spend ${budget.burn_monthly:,.0f}, and have "
        f"${budget.surplus_monthly:,.0f} surplus with ${budget.cash_on_hand:,.0f} cash. "
        f"Ask a sharper question: rent, investing, spending, or runway."
    )
    actions = [
        f"Try “can I afford ${scenario.target_rent:,.0f} rent?”",
        "Try “where is my money going?”",
        f"Try “can I invest ${scenario.invest_monthly:.0f}/month anyway?”",
    ]
    return Advice(summary=summary, actions=actions[:3])
