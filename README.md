# YT to Text — Remote MCP Server, REST API & n8n Workflows

[![YT to Text MCP connector](https://glama.ai/mcp/connectors/com.yttotext/yt-to-text/badges/score.svg)](https://glama.ai/mcp/connectors/com.yttotext/yt-to-text)

Official integration repository for **[YT to Text](https://yttotext.com)** — a hosted remote [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server, batch REST API, and signed webhook channel monitor for YouTube transcripts.

Connect **Claude Code**, **Claude Desktop**, **Cursor**, **Windsurf**, and **n8n** directly to YouTube video, Shorts, and playlist transcripts without installing local Python/Node packages, maintaining `yt-dlp` binaries, or managing residential proxies.

- **Remote MCP Endpoint:** `POST https://yttotext.com/api/mcp` (Stateless Streamable HTTP, JSON-RPC 2.0, MCP protocol `2025-03-26`)
- **MCP Setup Guide:** https://yttotext.com/youtube-transcript-mcp
- **REST API Reference:** https://yttotext.com/youtube-transcript-api
- **Channel Monitoring & Webhooks:** https://yttotext.com/youtube-channel-monitor
- **No-Captions AI Transcription:** https://yttotext.com/youtube-transcript-without-captions
- **Playlist Markdown Export (NotebookLM / Claude):** https://yttotext.com/youtube-to-notebooklm
- **Public Changelog:** https://yttotext.com/changelog

---

## Why Use a Hosted Remote MCP Endpoint?

- **Zero local runtime:** No Python environment, no local stdio process, no headless browser, and no IP/datacenter blocks from YouTube.
- **Works even without native captions:** When a public YouTube video has no human or auto-generated subtitles, YT to Text falls back to AI speech-to-text transcription automatically.
- **Built-in pagination for long videos:** `get_transcript` and `get_transcript_status` support `offset` and `maxChars` (`24,000` default, up to `60,000`) so multi-hour podcasts never overflow an LLM context window.
- **Standard Streamable HTTP discovery:** Unauthenticated `initialize`, `ping`, and `tools/list` handshakes return `200 OK` per the MCP `2025-03-26` specification; all `tools/call` executions strictly require a valid Bearer API token (`401 INVALID_API_TOKEN` otherwise).

---

## Quick Start: Remote MCP

### 1. Create an API Token

1. Sign in at [yttotext.com/developers](https://yttotext.com/developers) and generate a revocable `ytt_live_...` API key.
2. Signed-in free accounts share the daily **2-transcript** test allowance so you can test MCP and REST integrations immediately without a credit card. Paid Plus/Pro plans and one-time credit packs unlock higher monthly/project quotas (see [yttotext.com/pricing](https://yttotext.com/pricing)).

### 2. Connect Your MCP Client

#### Claude Code CLI

```bash
claude mcp add --transport http yt-to-text https://yttotext.com/api/mcp \
  --header "Authorization: Bearer $YTTOTEXT_API_KEY"
```

#### Cursor / Claude Desktop (`mcp.json`)

```json
{
  "mcpServers": {
    "yt-to-text": {
      "url": "https://yttotext.com/api/mcp",
      "headers": {
        "Authorization": "Bearer ytt_live_YOUR_API_KEY"
      }
    }
  }
}
```

See also [`.mcp.json`](./.mcp.json) and [`examples/cursor-claude-desktop-mcp.json`](./examples/cursor-claude-desktop-mcp.json).

---

## Live Protocol Verification (cURL)

### Protocol Discovery (No Token Required)

```bash
# 1. MCP Initialize handshake
curl -sS -X POST https://yttotext.com/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl-check","version":"1.0.0"}}}'

# 2. List available tools
curl -sS -X POST https://yttotext.com/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

### Execute a Tool (Bearer Token Required)

```bash
curl -sS -X POST https://yttotext.com/api/mcp \
  -H "Authorization: Bearer $YTTOTEXT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_transcript",
      "arguments": {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "language": "en",
        "includeTimestamps": true,
        "maxChars": 24000
      }
    }
  }'
```

---

## Available MCP Tools

| Tool | Required Arguments | Optional Arguments | Behavior & Output |
| --- | --- | --- | --- |
| `get_transcript` | `url` (YouTube watch, `youtu.be`, Shorts URL, or 11-char video ID) | `language` (`"en"`), `includeTimestamps` (`false`), `offset` (`0`), `maxChars` (`24000`, max `60000`) | Extracts clean or `[MM:SS]`-timestamped transcript text with video metadata, total character count, and pagination cursors (`hasMore`, `nextOffset`). Falls back to AI speech transcription if captions are absent. |
| `get_transcript_status` | `requestId` (UUID returned by `get_transcript`) | `includeTimestamps`, `offset`, `maxChars` | Polls an in-progress async transcription job or fetches subsequent paginated chunks of a long transcript without re-billing. |
| `list_playlist_videos` | `url` (public YouTube playlist URL) | `limit` (`1`–`50`, default `20`) | Returns playlist title, playlist ID, and ordered video items (`videoId`, `title`, `url`, `durationSeconds`, `position`). |

---

## Authentication, Security & Operations

- **Transport & Encryption:** HTTPS/TLS 1.3 only at `https://yttotext.com/api/mcp` (Cloudflare Workers edge + Google Cloud Run extraction backend).
- **Authentication:** `Authorization: Bearer ytt_live_...` header required for every `tools/call` request. Unauthenticated `tools/call` returns `HTTP 401` (`INVALID_API_TOKEN`). Tokens can be rotated or revoked instantly from [yttotext.com/developers](https://yttotext.com/developers).
- **Webhook Integrity:** Channel Watchlist webhooks include `X-YTToText-Event-Id`, `X-YTToText-Timestamp`, and `X-YTToText-Signature: v1=<hmac-sha256>` computed over `${timestamp}.${rawBody}` with a recommended 300-second replay window.
- **Support & Maintenance:** Actively maintained by the YT to Text team. Support: `support@yttotext.com` · Changelog: [yttotext.com/changelog](https://yttotext.com/changelog).

---

## Ready-to-Import n8n Workflows

Import either JSON template directly into your n8n canvas:

1. **[`n8n/youtube-channel-monitor-ai-brief-slack-sheets.json`](./n8n/youtube-channel-monitor-ai-brief-slack-sheets.json)** — Complete 10-node automated channel research pipeline: receives signed `transcript.ready` webhooks from YT to Text Watchlists, verifies the HMAC-SHA256 signature and 5-minute replay window (returning `401` on invalid signatures), cleans and truncates the transcript, generates a structured JSON summary with OpenAI, posts a formatted digest to Slack, archives a row to Google Sheets, and acknowledges `200 OK`.
2. **[`n8n/youtube-transcript-api-batch-poll.json`](./n8n/youtube-transcript-api-batch-poll.json)** — Submits up to 50 video IDs with an `Idempotency-Key` header to `POST /api/v1/transcripts`, polls until completed, and splits per-video transcript items for downstream LLM or RAG nodes.

---

## REST API & Webhook Verification Examples

- [`examples/rest-api-batch.py`](./examples/rest-api-batch.py) — Python batch submit, poll, and cursor pagination
- [`examples/rest-api-batch.mjs`](./examples/rest-api-batch.mjs) — Node.js / ESM batch submit, poll, and pagination
- [`examples/verify-webhook.mjs`](./examples/verify-webhook.mjs) — Node.js HMAC-SHA256 signature verification (`X-YTToText-Timestamp`, `X-YTToText-Signature`)
- [`examples/verify-webhook.py`](./examples/verify-webhook.py) — Python HMAC-SHA256 signature verification
- [`server.json`](./server.json) — Official MCP Registry manifest

---

## Sample Outputs (Public, No Signup Required)

Inspect real production output formats directly before integrating:

- Plain text: https://yttotext.com/samples/sample-transcript.txt
- SubRip (`.srt`): https://yttotext.com/samples/sample-subtitles.srt
- WebVTT (`.vtt`): https://yttotext.com/samples/sample-subtitles.vtt
- Combined NotebookLM Markdown (`.md`): https://yttotext.com/samples/sample-notebooklm-playlist.md
- REST API JSON: https://yttotext.com/samples/sample-api-response.json

## License

MIT — see [LICENSE](./LICENSE).
