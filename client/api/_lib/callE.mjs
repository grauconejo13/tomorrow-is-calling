import { randomUUID } from "node:crypto";
import { createDemoRateLimiter } from "./demoRateLimit.mjs";

const CALL_E_API_KEY = process.env.CALL_E_API_KEY;
const CALL_E_BASE_URL = process.env.CALL_E_BASE_URL ?? "https://api.heycall-e.com";
const ALLOWED_RECIPIENTS = new Set(
  (process.env.CALL_E_ALLOWED_RECIPIENTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

export const demoRateLimiter = createDemoRateLimiter(process.env);

export function sendJson(res, status, body) {
  res.status(status).json(body);
}

export function allowCors(req, res) {
  const configuredOrigin = process.env.ALLOWED_ORIGIN;
  const requestOrigin = req.headers?.origin;
  const origin = configuredOrigin || requestOrigin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

export function handleOptions(req, res) {
  if (req.method !== "OPTIONS") return false;
  allowCors(req, res);
  res.status(204).end();
  return true;
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};

  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

export function hasApiKey() {
  return Boolean(CALL_E_API_KEY);
}

export function sanitizePhone(phone) {
  return String(phone ?? "").replace(/[^+\d]/g, "");
}

export function validateRecipient(phone) {
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return "Recipient phone must be supplied in E.164 format.";
  }
  if (ALLOWED_RECIPIENTS.size && !ALLOWED_RECIPIENTS.has(phone)) {
    return "Recipient is not allowlisted for this deployment.";
  }
  return null;
}

function formatUsd(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "not provided";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function validateConfirmedQuote(request) {
  const quote = request?.quote;
  if (!quote) return "A quote is required before placing the quote-decision call.";

  if ([quote.confirmedTotal, quote.initialPayment, quote.remainingBalance]
    .some((value) => !Number.isFinite(Number(value)))) {
    return "Confirmed quote, initial payment, and remaining balance must be supplied before placing the call.";
  }

  return null;
}

export function buildTask(request) {
  const customerName = request.customer?.fullName ?? "the customer";
  const vehicle = `${request.vehicle?.year ?? ""} ${request.vehicle?.make ?? ""} ${request.vehicle?.model ?? ""}`.trim();
  const pickupAddress = request.pickup?.address ?? "not provided";
  const pickupWindow = request.pickup?.preferredWindow ?? "not provided";
  const deliveryAddress = request.delivery?.address ?? "not provided";
  const deliveryWindow = request.delivery?.preferredWindow ?? "not provided";
  const quote = request.quote ?? {};
  const estimateLow = formatUsd(quote.estimateLow);
  const estimateHigh = formatUsd(quote.estimateHigh);
  const confirmedTotal = formatUsd(quote.confirmedTotal);
  const initialPayment = formatUsd(quote.initialPayment);
  const remainingBalance = formatUsd(quote.remainingBalance);
  const depositPercent = Number.isFinite(Number(quote.depositPercent))
    ? `${Number(quote.depositPercent)}%`
    : "the agreed initial payment";

  return [
    `You are Tomorrow Is Calling, a concise AI-assisted vehicle-transport coordination agent.`,
    `Call ${customerName} about transport request ${request.reference ?? "unknown"}.`,
    `Your purpose is to present the confirmed transport quote and capture the customer's decision.`,
    `First ask whether you are speaking with ${customerName}. Do not disclose transport, route, vehicle, scheduling, or pricing details until the recipient confirms they are ${customerName}.`,
    `If the recipient is not ${customerName}, do not disclose any request details. Ask whether ${customerName} is available. If they are unavailable, politely end the call and mark the request for human follow-up.`,
    `After identity is confirmed, identify yourself as Tomorrow Is Calling and explain that this is an AI-assisted service call about their vehicle transport request.`,
    `Briefly confirm the request context: vehicle ${vehicle || "not provided"}; pickup ${pickupAddress}, preferred window ${pickupWindow}; delivery ${deliveryAddress}, preferred window ${deliveryWindow}.`,
    `The earlier estimate was ${estimateLow} to ${estimateHigh}. The confirmed transport price is ${confirmedTotal}.`,
    `The selected demo payment terms are ${depositPercent} initially: ${initialPayment} after quote acceptance, with ${remainingBalance} remaining at delivery. Do not imply that these payment terms are universal industry terms.`,
    `State the confirmed price clearly and ask: "Would you like to accept this quote?"`,
    `Treat only an explicit yes or clear agreement to proceed as acceptance.`,
    `If the customer accepts, explain that a secure payment link will be sent separately by email or text. Do not collect card numbers, bank details, CVV codes, account numbers, or other payment credentials during the call.`,
    `If the customer declines, acknowledge the decision and do not pressure them.`,
    `If the customer wants time to think, record the decision as thinking.`,
    `If the customer asks for the quote by email, record email_requested.`,
    `If the customer says the price is too high, mentions a competitor price, asks for a discount, or wants the price changed, record a price objection and route it for human review.`,
    `Do not promise a carrier, driver, pickup time, delivery time, ETA, insurance term, cancellation term, or business policy that is not supplied in this request.`,
    `If the customer asks something you cannot answer from the supplied request, explain that you will flag it for a human transport coordinator.`,
    `Before ending, briefly confirm the customer's decision and any unresolved question.`,
    `Keep the call concise, calm, and professional.`,
  ].join(" ");
}

export function buildTestTask(name) {
  const recipientName = String(name ?? "there").trim() || "there";
  return [
    `This is a short connection test for Tomorrow Is Calling.`,
    `When the recipient answers, say exactly: "Good evening, ${recipientName}. Tomorrow is calling."`,
    `Then say: "This is a test call to confirm the connection is working."`,
    `Do not ask for personal information, payment information, or any transport details.`,
    `After the recipient acknowledges the test, politely end the call.`,
  ].join(" ");
}

export async function createUpstreamCall(body) {
  const upstream = await fetch(`${CALL_E_BASE_URL}/v1/calls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CALL_E_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify(body),
  });

  const payload = await upstream.json().catch(() => ({}));
  return { upstream, payload };
}

export async function fetchUpstreamCall(callId) {
  const upstream = await fetch(`${CALL_E_BASE_URL}/v1/calls/${encodeURIComponent(callId)}`, {
    headers: { Authorization: `Bearer ${CALL_E_API_KEY}` },
  });
  const payload = await upstream.json().catch(() => ({}));
  return { upstream, payload };
}

export async function reserveDemoCall(phone) {
  return demoRateLimiter.reserve(phone);
}

export function demoLimitBody(reservation) {
  const message = reservation.scope === "global"
    ? `The public demo has reached its ${reservation.limit}-call limit for this window. Please try again later.`
    : `Demo limit reached. Each phone number can receive up to ${reservation.limit} calls per 24 hours.`;

  return {
    error: message,
    demo_limit: {
      scope: reservation.scope,
      limit: reservation.limit,
      retry_after_seconds: reservation.retryAfterSeconds,
    },
  };
}

export function attachDemoUsage(payload, reservation) {
  if (!reservation?.enabled || !payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  return {
    ...payload,
    demo_usage: {
      phone_remaining: reservation.phoneRemaining,
      global_remaining: reservation.globalRemaining,
      window_seconds: demoRateLimiter.windowSeconds,
    },
  };
}

export const recipientResultSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "reached",
    "identity_confirmed",
    "quote_presented",
    "quote_decision",
    "human_help_needed",
    "next_action",
    "summary",
  ],
  properties: {
    reached: { type: "boolean" },
    identity_confirmed: { type: "boolean" },
    quote_presented: { type: "boolean" },
    quote_decision: {
      type: "string",
      enum: ["accepted", "declined", "thinking", "email_requested", "price_objection", "unclear"],
    },
    next_action: {
      type: "string",
      enum: [
        "SEND_PAYMENT_LINK",
        "CLOSE_OR_FOLLOW_UP",
        "EMAIL_QUOTE",
        "WAIT_FOR_CUSTOMER",
        "HUMAN_REVIEW",
        "RETRY_OR_HUMAN_REVIEW",
      ],
    },
    human_help_needed: { type: "boolean" },
    customer_questions: { type: "array", items: { type: "string" } },
    price_objection_reason: { type: "string" },
    competitor_price_mentioned: { type: "string" },
    summary: { type: "string" },
  },
};
