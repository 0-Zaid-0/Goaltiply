import type { Profile, ReadyStatus, Session } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function createSession(mode: "demo" | "live" = "demo") {
  return request<{ session_id: string; status: string; mode: string }>("/v1/sessions", {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export function getSession(id: string) {
  return request<Session>(`/v1/sessions/${id}`);
}

export function putProfile(id: string, profile: Profile) {
  return request<Session>(`/v1/sessions/${id}/profile`, {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export function ingest(id: string) {
  return request<{ txn_count: number; ingest_status: string }>(`/v1/sessions/${id}/ingest`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function sendMessage(id: string, text: string) {
  return request<Session>(`/v1/sessions/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function getReady() {
  return request<ReadyStatus>("/v1/ready");
}

export function saveGeminiKey(api_key: string) {
  return request<ReadyStatus["gemini"]>("/v1/runtime/gemini", {
    method: "POST",
    body: JSON.stringify({ api_key }),
  });
}
