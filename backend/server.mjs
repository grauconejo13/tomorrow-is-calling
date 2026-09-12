import http from "node:http";
import { randomUUID } from "node:crypto";

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
    return "Recipient is not allowlisted for this demo.";
  }
  return null;
}

function buildTask(request) {
  const customerName = request.customer?.fullName ?? "the customer";
  const vehicle = `${request.vehicle?.year ?? ""} ${request.vehicle?.make ?? ""} ${request.vehicle?.model ?? ""}`.trim();
  return [
    `You are Tomorrow Is Calling, a concise AI-assisted vehicle-transport coordination agent.`,
    `Call ${customerName} about transport request ${request.reference ?? "unknown"}.`,
    `When the recipient answers, greet them by name and identify yourself as Tomorrow Is Calling before explaining that this is an AI-assisted service call.`,
    `Vehicle: ${vehicle || "not provided"}.`,
    `Pickup: ${request.pickup?.address ?? "not provided"}, preferred window ${request.pickup?.preferredWindow ?? "not provided"}.`,
    `Delivery: ${request.delivery?.address ?? "not provided"}, preferred window ${request.delivery?.preferredWindow ?? "not provided"}.`,
    `Goal: confirm the customer received the service/authorization information, identify questions or blockers, confirm expected completion timing, and determine whether human help is needed.`,
    `Keep the call concise and conversational.`,
    `Do not request payment-card information or other sensitive financial data.`,
  ].join(" ");
}

function buildTestTask(name) {
  const recipientName = String(name ?? "Vanessa").trim() || "Vanessa";
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
    return json(res, 200, { status: "ok", service: "tomorrow-is-calling-backend" });
  }

  if (!CALL_E_API_KEY) {
    return json(res, 503, { error: "CALL_E_API_KEY is not configured on the server." });
  }

  if (req.url === "/api/test-call" && req.method === "POST") {
    try {
      const { phone: rawPhone, name, consent } = await readJson(req);
      const phone = sanitizePhone(rawPhone);
      const recipientError = validateRecipient(phone);
      if (recipientError) return json(res, recipientError.includes("allowlisted") ? 403 : 400, { error: recipientError });
      if (!consent) {
        return json(res, 400, { error: "Contact consent is required before placing a test call." });
      }

      const { upstream, payload } = await createUpstreamCall({
        task: buildTestTask(name),
        recipients: [{ phones: [phone] }],
        metadata: { purpose: "temporary_connection_test" },
      });

      return json(res, upstream.status, payload);
    } catch (error) {
      return json(res, 500, { error: error instanceof Error ? error.message : "Unable to create test call." });
    }
  }

  if (req.url === "/api/calls" && req.method === "POST") {
    try {
      const { request } = await readJson(req);
      const phone = sanitizePhone(request?.customer?.phone);
      const recipientError = validateRecipient(phone);
      if (recipientError) return json(res, recipientError.includes("allowlisted") ? 403 : 400, { error: recipientError });
      if (!request?.consentToContact) {
        return json(res, 400, { error: "Contact consent is required before placing a call." });
      }

      const { upstream, payload } = await createUpstreamCall({
        task: buildTask(request),
        recipients: [{ phones: [phone] }],
        recipient_result_schema: {
          type: "object",
          additionalProperties: false,
          required: ["reached", "form_received", "completion_timing", "human_help_needed"],
          properties: {
            reached: { type: "boolean" },
            form_received: { type: "string", enum: ["yes", "no", "unknown"] },
            completion_timing: { type: "string" },
            human_help_needed: { type: "boolean" },
            blockers: { type: "array", items: { type: "string" } },
          },
        },
        metadata: { request_reference: request.reference ?? "unknown" },
      });

      return json(res, upstream.status, payload);
    } catch (error) {
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
