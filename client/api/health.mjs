import {
  allowCors,
  demoRateLimiter,
  handleOptions,
  hasApiKey,
  sendJson,
} from "./_lib/callE.mjs";

export default async function handler(req, res) {
  allowCors(req, res);
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  return sendJson(res, 200, {
    status: "ok",
    service: "tomorrow-is-calling-vercel-api",
    call_e_configured: hasApiKey(),
    demo_public_mode: demoRateLimiter.enabled,
    demo_rate_limit_store: demoRateLimiter.store,
    demo_call_limit_per_phone: demoRateLimiter.perPhoneLimit,
    demo_global_call_limit: demoRateLimiter.globalLimit,
  });
}
