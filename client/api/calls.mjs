import {
  allowCors,
  attachDemoUsage,
  buildTask,
  createUpstreamCall,
  demoLimitBody,
  handleOptions,
  hasApiKey,
  readJson,
  recipientResultSchema,
  reserveDemoCall,
  sanitizePhone,
  sendJson,
  validateConfirmedQuote,
  validateRecipient,
} from "./_lib/callE.mjs";

export default async function handler(req, res) {
  allowCors(req, res);
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  if (!hasApiKey()) return sendJson(res, 503, { error: "CALL_E_API_KEY is not configured on the server." });

  let reservation;
  try {
    const { request } = await readJson(req);
    const phone = sanitizePhone(request?.customer?.phone);
    const recipientError = validateRecipient(phone);
    if (recipientError) {
      return sendJson(res, recipientError.includes("allowlisted") ? 403 : 400, { error: recipientError });
    }
    if (!request?.consentToContact) {
      return sendJson(res, 400, { error: "Contact consent is required before placing a call." });
    }

    const quoteError = validateConfirmedQuote(request);
    if (quoteError) return sendJson(res, 400, { error: quoteError });

    reservation = await reserveDemoCall(phone);
    if (!reservation.allowed) return sendJson(res, 429, demoLimitBody(reservation));

    const { upstream, payload } = await createUpstreamCall({
      task: buildTask(request),
      recipients: [{ phones: [phone] }],
      recipient_result_schema: recipientResultSchema,
      metadata: {
        purpose: "confirmed_quote_decision",
        request_reference: request.reference ?? "unknown",
        confirmed_total: request.quote.confirmedTotal,
        initial_payment: request.quote.initialPayment,
        remaining_balance: request.quote.remainingBalance,
      },
    });

    if (!upstream.ok) await reservation.release();
    return sendJson(res, upstream.status, attachDemoUsage(payload, reservation));
  } catch (error) {
    if (reservation?.release) await reservation.release();
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unable to create call.",
    });
  }
}
