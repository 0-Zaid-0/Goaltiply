# MultiPly / Goaltiply

Google AI hackathon copilot. See [HACKATHON.md](HACKATHON.md) for the 90-second
stage script.

The website is the team's MultiPly Next.js UI in `web/` (from
[pandeybhavya37-source/Goaltiply](https://github.com/pandeybhavya37-source/Goaltiply)).
Numbers and chat answers come from the orchestrator on port 8000 (`/v1`).
The Next app does **not** call Gemini. If the orchestrator is down, chat
falls back to the local mock at `/api/scenario`.

## Run

```bash
cd orchestrator && uv sync --extra dev && uv run python -m uvicorn app.main:app --reload --port 8000
cd web && npm install && npm run dev
```

Open http://localhost:3000

1. Autofill the Austin sample profile (monthly income is after-tax).
2. Paste a Gemini key from https://aistudio.google.com/apikey (sidebar → Save and verify).
3. Ask the chips: $1,450 rent, spending, invest $200, $975 rent, when can I move.
4. Connect / open the Google Sheet, or use budget HTML / Excel from the dashboard.
5. If live fails: http://localhost:3000/fallback

Without a key the demo still runs on rules. Judges will want Gemini live.
