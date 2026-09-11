.PHONY: demo orchestrator web test

demo: orchestrator web

orchestrator:
	cd orchestrator && uv sync --extra dev && uv run uvicorn app.main:app --reload --port 8000 --host 127.0.0.1

web:
	cd web && npm install && npm run dev

test:
	cd orchestrator && uv sync --extra dev && uv run pytest -q
