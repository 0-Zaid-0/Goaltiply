# MultiPly

Google AI hackathon copilot. See [HACKATHON.md](HACKATHON.md) for the 90-second
stage script.

## Run

```bash
cd orchestrator && uv run uvicorn app.main:app --reload --port 8000
cd web && npm run dev
```

Open http://localhost:3000

1. Paste a Gemini key from https://aistudio.google.com/apikey (Save and verify).
2. Use demo bank data → Build budget.
3. Show Not yet on $1,450 rent, then the other chips.
4. Open budget HTML / Excel / [Google Sheet](https://docs.google.com/spreadsheets/d/1qDPrJLFSfUOTkXvimIEDOimvCElyME_jQzh30BChyg8/edit).
5. If live fails: http://localhost:3000/fallback

Without a key the demo still runs on rules. Judges will want Gemini live.

## Swap with your team

Frontend → same `/v1` API. Spreadsheet MCP → replace `integrations/spreadsheet.py`.
You keep the orchestrator.
