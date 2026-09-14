import http from "node:http";
import { randomUUID } from "node:crypto";
import { createDemoRateLimiter } from "./demoRateLimit.mjs";

const PORT = Number(process.env.PORT ?? 8787);
const CALL_E_API_KEY = process.env.CALL_E_API_KEY;
const CALL_E_BASE_URL = process.env.CALL_E_BASE_URL ?? "https://api.heycall-e.com";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:5173";
const ALLOWED_RECIPIENTS = new Set(
  (process.env.CALL_E_ALLOWED_RECIPIENTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const demoRateLimiter = createDemoRateLimiter(process.env);

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  return JSON.parse(raw);
}

function sanitizePhone(phone) {
  return String(phone ?? "").replace(/[^+\d]/g, "");
}

function validateRecipient(phone) {
  if (!phone.startsWith("+") || phone.length < 8) {
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

function validateConfirmedQuote(request) {
  const quote = request?.quote;
  if (!quote) return "A quote is required before placing the quote-decision call.";

  const requiredAmounts = [
    quote.confirmedTotal,
    quote.initialPayment,
    quote.remainingBalance,
  ];

  if (requiredAmounts.some((value) => !Number.isFinite(Number(value)))) {
    return "Confirmed quote, initial payment, and remaining balance must be supplied before placing the call.";
  }

  return null;
}

function buildTask(request) {
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
    `Treat only an explicit yes or clear agreement to proceed as acceptance. Do not infer acceptance from silence, uncertainty, or a request for more information.`,
    `If the customer accepts, explain that a secure payment link will be sent separately by email or text and that payment credentials must be entered only on that secure page. Do not collect card numbers, bank details, CVV codes, account numbers, or other payment credentials during the call.`,
    `If the customer declines, acknowledge the decision and do not pressure them.`,
    `If the customer wants time to think, record the decision as thinking and explain that the quote can remain pending for follow-up.`,
    `If the customer asks for the quote by email, record email_requested and explain that the quote will be sent separately.`,
    `If the customer says the price is too high, mentions a competitor price, asks for a discount, or wants the price changed, record a price objection and route it for human review. You may explain the supplied quote, but you must not invent, promise, negotiate, or authorize a discount or a different price.`,
    `Do not promise a carrier, driver, pickup time, delivery time, ETA, insurance term, cancellation term, or business policy that is not supplied in this request.`,
    `If the customer asks something you cannot answer from the supplied request, explain that you will flag it for a human transport coordinator.`,
    `Before ending, briefly confirm the customer's decision and any unresolved question.`,
    `Keep the call concise, calm, and professional.`,
  ].join(" ");
}

function buildTestTask(name) {
  const recipientName = String(name ?? "there").trim() || "there";
  return [
    `This is a short connection test for Tomorrow Is Calling.`,
    `When the recipient answers, say exactly: "Good evening, ${recipientName}. Tomorrow is calling."`,
    `Then say: "This is a test call to confirm the connection is working."`,
    `Do not ask for personal information, payment information, or any transport details.`,
    `After the recipient acknowledges the test, politely end the call.`,
  ].join(" ");
}

async function createUpstreamCall(body) {
  const upstream = await fetch(`${CALL_E_BASE_URL}/v1/calls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CALL_E_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify(body),
  });

  const payload = await upstream.json();
  return { upstream, payload };
}

async function reserveDemoCall(phone, res) {
  try {
    const reservation = await demoRateLimiter.reserve(phone);
    if (reservation.allowed) return reservation;

    const message = reservation.scope === "global"
      ? `The public demo has reached its ${reservation.limit}-call limit for this window. Please try again later.`
      : `Demo limit reached. Each phone number can receive up to ${reservation.limit} calls per 24 hours.`;

    json(res, 429, {
      error: message,
      demo_limit: {
        scope: reservation.scope,
        limit: reservation.limit,
        retry_after_seconds: reservation.retryAfterSeconds,
      },
    });
    return null;
  } catch {
    json(res, 503, {
      error: "The public demo rate-limit service is temporarily unavailable. No call was placed.",
    });
    return null;
  }
}

function attachDemoUsage(payload, reservation) {
  if (!reservation?.enabled || !payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  return {
    ...payload,
    demo_usage: {
      phone_remaining: reservation.phoneRemaining,
      global_remaining: reservation.globalRemaining,
      window_seconds: demoRateLimiter.windowSeconds,
    },
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    return res.end();
  }

  if (req.url === "/health" && req.method === "GET") {
    return json(res, 200, {
      status: "ok",
      service: "tomorrow-is-calling-backend",
      demo_public_mode: demoRateLimiter.enabled,
      demo_rate_limit_store: demoRateLimiter.store,
      demo_call_limit_per_phone: demoRateLimiter.perPhoneLimit,
      demo_global_call_limit: demoRateLimiter.globalLimit,
    });
  }

  if (!CALL_E_API_KEY) {
    return json(res, 503, { error: "CALL_E_API_KEY is not configured on the server." });
  }

  if (req.url === "/api/test-call" && req.method === "POST") {
    let reservation;
    try {
      const { phone: rawPhone, name, consent } = await readJson(req);
      const phone = sanitizePhone(rawPhone);
      const recipientError = validateRecipient(phone);
      if (recipientError) return json(res, recipientError.includes("allowlisted") ? 403 : 400, { error: recipientError });
      if (!consent) {
        return json(res, 400, { error: "Contact consent is required before placing a test call." });
      }

      reservation = await reserveDemoCall(phone, res);
      if (!reservation) return;

      const { upstream, payload } = await createUpstreamCall({
        task: buildTestTask(name),
        recipients: [{ phones: [phone] }],
        metadata: { purpose: "temporary_connection_test" },
      });

      if (!upstream.ok) await reservation.release();
      return json(res, upstream.status, attachDemoUsage(payload, reservation));
    } catch (error) {
      if (reservation?.release) await reservation.release();
      return json(res, 500, { error: error instanceof Error ? error.message : "Unable to create test call." });
    }
  }

  if (req.url === "/api/calls" && req.method === "POST") {
    let reservation;
    try {
      const { request } = await readJson(req);
      const phone = sanitizePhone(request?.customer?.phone);
      const recipientError = validateRecipient(phone);
      if (recipientError) return json(res, recipientError.includes("allowlisted") ? 403 : 400, { error: recipientError });
      if (!request?.consentToContact) {
        return json(res, 400, { error: "Contact consent is required before placing a call." });
      }

      const quoteError = validateConfirmedQuote(request);
      if (quoteError) {
        return json(res, 400, { error: quoteError });
      }

      reservation = await reserveDemoCall(phone, res);
      if (!reservation) return;

      const { upstream, payload } = await createUpstreamCall({
        task: buildTask(request),
        recipients: [{ phones: [phone] }],
        recipient_result_schema: {
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
              enum: [
                "accepted",
                "declined",
                "thinking",
                "email_requested",
                "price_objection",
                "unclear",
              ],
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
        },
        metadata: {
          purpose: "confirmed_quote_decision",
          request_reference: request.reference ?? "unknown",
          confirmed_total: request.quote.confirmedTotal,
          initial_payment: request.quote.initialPayment,
          remaining_balance: request.quote.remainingBalance,
        },
      });

      if (!upstream.ok) await reservation.release();
      return json(res, upstream.status, attachDemoUsage(payload, reservation));
    } catch (error) {
      if (reservation?.release) await reservation.release();
      return json(res, 500, { error: error instanceof Error ? error.message : "Unable to create call." });
    }
  }

  const callMatch = req.url?.match(/^\/api\/calls\/(call_[A-Za-z0-9_-]+)$/);
  if (callMatch && req.method === "GET") {
    try {
      const upstream = await fetch(`${CALL_E_BASE_URL}/v1/calls/${callMatch[1]}`, {
        headers: { Authorization: `Bearer ${CALL_E_API_KEY}` },
      });
      const payload = await upstream.json();
      return json(res, upstream.status, payload);
    } catch (error) {
      return json(res, 500, { error: error instanceof Error ? error.message : "Unable to fetch call." });
    }
  }

  return json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Tomorrow Is Calling backend listening on port ${PORT}`);
});
