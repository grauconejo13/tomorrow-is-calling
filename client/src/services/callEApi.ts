import type { TransportRequest } from "../types/transport";

// Production uses the same Vercel deployment for frontend + API routes.
// Set VITE_API_BASE_URL only when pointing the client at a separate backend (for example local development).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export type CallEStatus = "queued" | "in_progress" | "completed" | "failed" | "canceled";

export type CallEResponse = {
  id: string;
  status: CallEStatus;
  summary?: string | null;
  structured_result?: unknown;
  recipients?: Array<{
    structured_result?: unknown;
    summary?: string | null;
  }>;
  failure_message?: string | null;
  demo_usage?: {
    phone_remaining?: number;
    global_remaining?: number;
    window_seconds?: number;
  };
};

async function parse(response: Response): Promise<CallEResponse> {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error ?? payload?.detail ?? payload?.failure_message ?? "CALL-E request failed.");
  }
  return payload;
}

export async function createCall(request: TransportRequest): Promise<CallEResponse> {
  const response = await fetch(`${API_BASE_URL}/api/calls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request }),
  });
  return parse(response);
}

export async function createTestCall(phone: string, name: string, consent: boolean): Promise<CallEResponse> {
  const response = await fetch(`${API_BASE_URL}/api/test-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name, consent }),
  });
  return parse(response);
}

export async function getCall(callId: string): Promise<CallEResponse> {
  const response = await fetch(`${API_BASE_URL}/api/call-status?callId=${encodeURIComponent(callId)}`);
  return parse(response);
}
