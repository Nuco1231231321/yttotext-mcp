# YT to Text — Remote MCP Server, REST API & n8n Workflows

Connect **Claude Code**, **Claude Desktop**, **Cursor**, **Windsurf**, and **n8n** directly to YouTube transcripts, playlist video lists, and automated channel monitoring without running local Python/Node scrapers or managing residential proxies.

- **Remote MCP Endpoint:** `POST https://yttotext.com/api/mcp` (Stateless Streamable HTTP, JSON-RPC 2.0, MCP protocol `2025-03-26`)
- **MCP Documentation:** [Remote MCP Setup Guide](https://yttotext.com/youtube-transcript-mcp)
- **REST API Reference:** [YT to Text Developer API](https://yttotext.com/youtube-transcript-api)
- **Channel Monitoring:** [Automated Channel Watchlists & Webhooks](https://yttotext.com/youtube-channel-monitor)
- **Playlist Export for AI:** [Combined Markdown Export for NotebookLM & Claude](https://yttotext.com/youtube-to-notebooklm)

---

## Quick Start: Remote MCP (No Local Server Required)

1. Sign in and create a `ytt_live_...` token at [yttotext.com/developers](https://yttotext.com/developers) (signed-in free accounts share the daily 2-transcript test allowance; paid plans unlock production monthly quotas).
2. Add the remote server to your MCP client:

### Claude Code CLI

```bash
claude mcp add --transport http yt-to-text https://yttotext.com/api/mcp \
  --header "Authorization: Bearer $YTTOTEXT_API_KEY"
```

### Cursor / Claude Desktop (`mcp.json`)

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

### Direct JSON-RPC Verification (cURL)

```bash
curl -X POST https://yttotext.com/api/mcp \
  -H "Authorization: Bearer $YTTOTEXT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Available MCP Tools

| Tool | Required Args | Optional Args | What it returns |
| --- | --- | --- | --- |
| `get_transcript` | `url` (YouTube watch/Shorts URL or 11-char video ID) | `language` (`"en"`), `includeTimestamps` (`false`), `offset` (`0`), `maxChars` (`24000`, max `60000`) | Clean or `[MM:SS]`-timestamped transcript text with metadata and pagination (`hasMore`, `nextOffset`). |
| `get_transcript_status` | `requestId` (UUID) | `includeTimestamps`, `offset`, `maxChars` | Polls an in-progress extraction or fetches the next paginated slice of a long video. |
| `list_playlist_videos` | `url` (public YouTube playlist URL) | `limit` (`1–50`, default `20`) | Playlist title, ID, and ordered video items (`videoId`, `title`, `url`, `position`). |

---

## Ready-to-Import n8n Workflows

Import either JSON template directly into your n8n canvas:

1. **[`n8n/youtube-channel-monitor-ai-brief-slack-sheets.json`](./n8n/youtube-channel-monitor-ai-brief-slack-sheets.json)** — End-to-end automated pipeline: receives signed `transcript.ready` webhooks from YT to Text Watchlists, verifies `X-YTToText-Signature` (`v1=<hmac-sha256>`) and the 5-minute replay window, summarizes the transcript into structured JSON with OpenAI, posts a formatted digest to Slack, archives rows to Google Sheets, and acknowledges `200 OK`.
2. **[`n8n/youtube-transcript-api-batch-poll.json`](./n8n/youtube-transcript-api-batch-poll.json)** — Submits up to 50 video IDs with `Idempotency-Key` to `POST /api/v1/transcripts`, polls until completed, and splits per-video transcript items for downstream LLM or RAG nodes.

---

## REST API & Webhook Verification Examples

- [`examples/rest-api-batch.py`](./examples/rest-api-batch.py) — Python batch submit, poll, and cursor pagination
- [`examples/rest-api-batch.mjs`](./examples/rest-api-batch.mjs) — Node.js / ESM batch submit, poll, and pagination
- [`examples/verify-webhook.mjs`](./examples/verify-webhook.mjs) — Node.js HMAC-SHA256 signature verification (`X-YTToText-Timestamp`, `X-YTToText-Signature`)
- [`examples/verify-webhook.py`](./examples/verify-webhook.py) — Python HMAC-SHA256 signature verification
- [`server.json`](./server.json) — Official MCP Registry manifest

## Sample Outputs (No Signup Required)

Inspect real production output formats directly:
- Plain text: https://yttotext.com/samples/sample-transcript.txt
- SubRip (.srt): https://yttotext.com/samples/sample-subtitles.srt
- WebVTT (.vtt): https://yttotext.com/samples/sample-subtitles.vtt
- Combined NotebookLM Markdown (.md): https://yttotext.com/samples/sample-notebooklm-playlist.md
- REST API JSON: https://yttotext.com/samples/sample-api-response.json

## License

MIT — see [LICENSE](./LICENSE).
