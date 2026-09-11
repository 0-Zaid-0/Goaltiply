from app.engines.advise import fallback_advice
from app.engines.budget import build_budget, income_monthly
from app.engines.categorize import categorize_rules
from app.engines.parse import parse_question
from app.engines.scenario import run_scenario
from app.integrations.bank import DEMO_CASH_ON_HAND, demo_transactions
from app.models import Profile


def _pack():
    profile = Profile()
    txns = categorize_rules(demo_transactions())
    budget = build_budget(profile, txns, DEMO_CASH_ON_HAND)
    return profile, txns, budget


def test_takehome_and_rent_cap():
    profile, txns, budget = _pack()
    takehome = income_monthly(profile)
    assert 3200 < takehome < 3300
    scenario = run_scenario("can I afford the apartment?", profile, budget, txns)
    assert scenario.intent == "housing"
    assert scenario.rent_cap == round(takehome * 0.30, 2)
    assert scenario.current_rent == 1050
    assert scenario.target_rent == 1450
    assert scenario.affordable is False
    assert scenario.runway_months < 3
    assert scenario.gap > 0
    assert scenario.months_until_ready > 0


def test_fixture_has_payroll_and_rent():
    txns = categorize_rules(demo_transactions())
    assert any(t.category == "Income" and t.amount > 0 for t in txns)
    assert any(t.category == "Housing" and t.is_recurring for t in txns)
    assert len(txns) > 40


def test_questions_are_not_the_same_answer():
    profile, txns, budget = _pack()
    apartment = run_scenario(
        "can I afford a $1450 apartment while investing $200/month?",
        profile,
        budget,
        txns,
    )
    spending = run_scenario("where is my money going each month?", profile, budget, txns)
    invest = run_scenario("can I start investing $200 a month anyway?", profile, budget, txns)
    cheaper = run_scenario("what if rent is $975 instead?", profile, budget, txns)
    when = run_scenario("when can I move out?", profile, budget, txns)

    a = fallback_advice(profile, budget, apartment).summary
    b = fallback_advice(profile, budget, spending).summary
    c = fallback_advice(profile, budget, invest).summary
    d = fallback_advice(profile, budget, cheaper).summary
    e = fallback_advice(profile, budget, when).summary

    assert len({a, b, c, d, e}) == 5
    assert apartment.intent == "housing"
    assert spending.intent == "spending"
    assert invest.intent == "invest"
    assert cheaper.intent == "housing"
    assert cheaper.target_rent == 975
    assert when.intent == "timeline"
    assert "Subscriptions" in b or "spend" in b.lower()
    assert "invest" in c.lower()
    assert "975" in d
    assert "wait" in e.lower() or "month" in e.lower()


def test_parse_extracts_rent_and_invest():
    parsed = parse_question("what if the rent is $1,200 and I invest $150?")
    assert parsed.intent == "housing"
    assert parsed.rent == 1200
    assert parsed.invest == 150
