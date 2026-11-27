/**
 * Verify YT to Text Channel Monitor webhook signatures (HMAC-SHA256).
 * Docs: https://yttotext.com/youtube-channel-monitor
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export function isValidYtToTextWebhook(rawBody, headers, secret, maxAgeSeconds = 300) {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v ?? "")])
  );
  const timestamp = lower["x-yttotext-timestamp"] ?? "";
  const signature = lower["x-yttotext-signature"] ?? "";
  if (!/^\d+$/.test(timestamp)) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > maxAgeSeconds) return false;

  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const expected = Buffer.from(`v1=${digest}`, "utf8");
  const received = Buffer.from(signature, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
