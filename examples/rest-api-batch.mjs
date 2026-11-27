/**
 * Extract YouTube transcripts in batch using the YT to Text REST API.
 * Docs: https://yttotext.com/youtube-transcript-api
 */
import { randomUUID } from "node:crypto";

const API_KEY = process.env.YTTOTEXT_API_KEY;
if (!API_KEY) throw new Error("Set YTTOTEXT_API_KEY first.");

const BASE_URL = "https://yttotext.com";
const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

export async function extractTranscripts(ids, language = "en") {
  const createRes = await fetch(`${BASE_URL}/api/v1/transcripts`, {
    method: "POST",
    headers: { ...headers, "Idempotency-Key": randomUUID() },
    body: JSON.stringify({ ids: ids.slice(0, 50), language }),
  });
  if (!createRes.ok) throw new Error(`Create failed: ${createRes.status} ${await createRes.text()}`);
  const { statusUrl } = await createRes.json();

  const results = [];
  let url = `${BASE_URL}${statusUrl}`;
  while (url) {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Poll failed: ${res.status} ${await res.text()}`);
    const page = await res.json();
    if (page.status === "queued" || page.status === "processing") {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    results.push(...(page.results ?? []));
    url = page.nextStatusUrl ? `${BASE_URL}${page.nextStatusUrl}` : null;
  }
  return results;
}

const items = await extractTranscripts(["jNQXAC9IVRw"], "en");
console.log(JSON.stringify(items, null, 2));
