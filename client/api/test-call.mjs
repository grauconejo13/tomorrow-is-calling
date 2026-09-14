import {
  allowCors,
  attachDemoUsage,
  buildTestTask,
  createUpstreamCall,
  demoLimitBody,
  handleOptions,
  hasApiKey,
  readJson,
  reserveDemoCall,
  sanitizePhone,
  sendJson,
  validateRecipient,
} from "./_lib/callE.mjs";

export default async function handler(req, res) {
  allowCors(req, res);
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  if (!hasApiKey()) return sendJson(res, 503, { error: "CALL_E_API_KEY is not configured on the server." });

  let reservation;
  try {
    const { phone: rawPhone, name, consent } = await readJson(req);
    const phone = sanitizePhone(rawPhone);
    const recipientError = validateRecipient(phone);
    if (recipientError) {
      return sendJson(res, recipientError.includes("allowlisted") ? 403 : 400, { error: recipientError });
    }
    if (!consent) {
      return sendJson(res, 400, { error: "Contact consent is required before placing a test call." });
    }

    reservation = await reserveDemoCall(phone);
    if (!reservation.allowed) return sendJson(res, 429, demoLimitBody(reservation));

    const { upstream, payload } = await createUpstreamCall({
      task: buildTestTask(name),
      recipients: [{ phones: [phone] }],
      metadata: { purpose: "temporary_connection_test" },
    });

    if (!upstream.ok) await reservation.release();
    return sendJson(res, upstream.status, attachDemoUsage(payload, reservation));
  } catch (error) {
    if (reservation?.release) await reservation.release();
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unable to create test call.",
    });
  }
}
