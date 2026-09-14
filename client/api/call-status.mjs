import {
  allowCors,
  fetchUpstreamCall,
  handleOptions,
  hasApiKey,
  sendJson,
} from "./_lib/callE.mjs";

export default async function handler(req, res) {
  allowCors(req, res);
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });
  if (!hasApiKey()) return sendJson(res, 503, { error: "CALL_E_API_KEY is not configured on the server." });

  const callId = String(req.query?.callId ?? "");
  if (!/^call_[A-Za-z0-9_-]+$/.test(callId)) {
    return sendJson(res, 400, { error: "A valid CALL-E call ID is required." });
  }

  try {
    const { upstream, payload } = await fetchUpstreamCall(callId);
    return sendJson(res, upstream.status, payload);
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unable to fetch call.",
    });
  }
}
