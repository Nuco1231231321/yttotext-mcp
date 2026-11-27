"""Extract YouTube transcripts in batch using the YT to Text REST API.

Docs: https://yttotext.com/youtube-transcript-api
"""

import os
import time
import uuid
import requests

API_KEY = os.environ["YTTOTEXT_API_KEY"]
BASE_URL = "https://yttotext.com"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


def extract_transcripts(video_ids: list[str], language: str = "en") -> list[dict]:
    resp = requests.post(
        f"{BASE_URL}/api/v1/transcripts",
        headers={**HEADERS, "Idempotency-Key": str(uuid.uuid4())},
        json={"ids": video_ids[:50], "language": language},
        timeout=30,
    )
    resp.raise_for_status()
    status_url = resp.json()["statusUrl"]

    results: list[dict] = []
    next_url: str | None = f"{BASE_URL}{status_url}"
    while next_url:
        page = requests.get(next_url, headers=HEADERS, timeout=30)
        page.raise_for_status()
        data = page.json()
        if data["status"] in ("queued", "processing"):
            time.sleep(5)
            continue
        results.extend(data.get("results", []))
        nxt = data.get("nextStatusUrl")
        next_url = f"{BASE_URL}{nxt}" if nxt else None
    return results


if __name__ == "__main__":
    items = extract_transcripts(["jNQXAC9IVRw"], language="en")
    for item in items:
        transcript = item.get("transcript") or {}
        print(item["id"], item["status"], transcript.get("title"))
        print((transcript.get("text") or "")[:300])
