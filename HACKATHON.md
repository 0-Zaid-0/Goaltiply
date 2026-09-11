# MultiPly — Google AI hackathon

## Pitch (20 seconds)

Young adults are priced out of advisors. Budget apps only show the past.
MultiPly uses **Gemini** to categorise a bank ledger, **code** to decide
“can I afford this life?”, and Gemini again to explain it. The user leaves
with a workbook (Excel / HTML / Google Sheet). Educational, not advice.

## Stage script (90 seconds)

1. Open http://localhost:3000
2. **Open demo** → paste Gemini key from https://aistudio.google.com/apikey → Save and verify
3. Use demo bank data → Build budget
4. Show **Not yet** on $1,450 rent (cap $975, runway ~1.6 months)
5. Click chips: spending, invest $200, **what if rent is $975**, when can I move
6. Open budget HTML + Excel. Point at Calendar MCP bills.

If live fails: http://localhost:3000/fallback

## Gemini slots

- Slot A: transaction → JSON categories
- Slot B: scenario numbers → summary + 3 actions
- Calculator always wins if they disagree

## Run

```bash
cd multiply/orchestrator && uv run uvicorn app.main:app --reload --port 8000
cd multiply/web && npm run dev
```

Key is saved to `orchestrator/.env` (gitignored).
