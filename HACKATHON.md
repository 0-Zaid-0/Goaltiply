# MultiPly — Google AI hackathon

## Pitch (20 seconds)

Young adults are priced out of advisors. Budget apps only show the past.
MultiPly uses **Gemini** to categorise a bank ledger, **code** to decide
“can I afford this life?”, and Gemini again to explain it. The user leaves
with a workbook (Excel / HTML / Google Sheet). Educational, not advice.

## Stage script (90 seconds)

1. Open http://localhost:3000 (team MultiPly UI)
2. Autofill the Austin sample → Start
3. Paste Gemini key from https://aistudio.google.com/apikey → Save and verify
4. Show **Not yet** on $1,450 rent (demo bank rent is $1,050 with a roommate)
5. Click chips: spending, invest $200, **what if rent is $975**, when can I move
6. Open the Google Sheet / budget HTML / Excel. Point at Calendar MCP bills.

If live fails: http://localhost:3000/fallback

## Gemini slots

- Slot A: transaction → JSON categories (orchestrator only)
- Slot B: scenario numbers → summary + 3 actions (orchestrator only)
- Calculator always wins if they disagree
- The Next.js app never calls Gemini

## Run

```bash
cd orchestrator && uv run python -m uvicorn app.main:app --reload --port 8000
cd web && npm run dev
```

Key is saved to `orchestrator/.env` (gitignored).
