from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse

from app.graph import build_orchestrator
from app.integrations import gemini as gemini_runtime
from app.models import (
    CreateSessionRequest,
    CreateSessionResponse,
    GeminiKeyRequest,
    IngestRequest,
    IngestResponse,
    MessageRequest,
    Profile,
    SessionResponse,
)

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
load_dotenv()

orch = build_orchestrator()
app = FastAPI(title="MultiPly Orchestrator", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/ready")
def ready() -> dict:
    load_dotenv(ROOT / ".env", override=True)
    status = gemini_runtime.ping() if gemini_runtime.configured() else {
        "configured": False,
        "verified": False,
        "model": gemini_runtime._model(),
        "error": "Paste a Gemini API key from https://aistudio.google.com/apikey",
    }
    return {
        "ok": True,
        "gemini": status,
        "workbook": "xlsx+html",
        "calendar": "fixture",
        "google_sheet_url": os.getenv("GOOGLE_SHEET_URL"),
    }


@app.post("/v1/runtime/gemini")
def set_gemini(body: GeminiKeyRequest) -> dict:
    try:
        gemini_runtime.persist_api_key(body.api_key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    status = gemini_runtime.ping()
    if not status.get("verified"):
        raise HTTPException(status_code=400, detail=status.get("error") or "Gemini ping failed")
    return status


@app.post("/v1/sessions", response_model=CreateSessionResponse)
def create_session(body: CreateSessionRequest) -> CreateSessionResponse:
    if body.gemini_api_key:
        gemini_runtime.persist_api_key(body.gemini_api_key)
        gemini_runtime.ping()
    session = orch.create_session(body.mode)
    return CreateSessionResponse(session_id=session.session_id, status=session.status, mode=session.mode)


@app.get("/v1/sessions/{session_id}", response_model=SessionResponse)
def get_session(session_id: str) -> SessionResponse:
    try:
        return orch.to_response(orch.get(session_id))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="session not found") from exc


@app.put("/v1/sessions/{session_id}/profile", response_model=SessionResponse)
def put_profile(session_id: str, profile: Profile) -> SessionResponse:
    try:
        session = orch.set_profile(session_id, profile)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="session not found") from exc
    return orch.to_response(session)


@app.post("/v1/sessions/{session_id}/ingest", response_model=IngestResponse)
def ingest(session_id: str, body: IngestRequest = IngestRequest()) -> IngestResponse:
    try:
        return orch.ingest(session_id, ask_demo=body.ask_demo)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="session not found") from exc


@app.post("/v1/sessions/{session_id}/messages", response_model=SessionResponse)
def message(session_id: str, body: MessageRequest) -> SessionResponse:
    try:
        session = orch.ask(session_id, body.text)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="session not found") from exc
    return orch.to_response(session)


@app.get("/v1/workbooks/{workbook_id}.xlsx")
def download_workbook(workbook_id: str) -> FileResponse:
    path = Path(orch.workbook_dir) / f"{workbook_id}.xlsx"
    if not path.exists():
        raise HTTPException(status_code=404, detail="workbook not found")
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="MultiPly-budget.xlsx",
    )


@app.get("/v1/workbooks/{workbook_id}.html")
def workbook_html(workbook_id: str) -> HTMLResponse:
    path = Path(orch.workbook_dir) / f"{workbook_id}.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="workbook not found")
    return HTMLResponse(path.read_text(encoding="utf-8"))
