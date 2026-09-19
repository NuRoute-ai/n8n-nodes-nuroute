# n8n-nodes-nuroute

[![npm version](https://img.shields.io/npm/v/n8n-nodes-nuroute)](https://www.npmjs.com/package/n8n-nodes-nuroute)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An [n8n](https://n8n.io) community node for sending chat completion requests through your
[NuRoute](https://nuroute.ai) gateway. Everything else
(projects, routing config, policy, budgets, API keys) is managed from the NuRoute dashboard —
this node is intentionally scoped to just chat completions.

Set the Model parameter to `auto` and NuRoute predicts the cheapest model that can still answer
each request well, so your workflow stops paying frontier prices for prompts a cheaper model
would handle just as well.

> This package replaces `n8n-nodes-aicp`, which is deprecated but still published and
> supported for existing installs. New workflows should install `n8n-nodes-nuroute`.

## Install

**From within n8n** (self-hosted instances): Settings → Community Nodes → Install →
`n8n-nodes-nuroute`.

**Local development / linking against this monorepo:**

```bash
pnpm --filter n8n-nodes-nuroute build
cd packages/n8n-nodes-nuroute && pnpm link --global
cd ~/.n8n/nodes && pnpm link --global n8n-nodes-nuroute   # or wherever N8N_CUSTOM_EXTENSIONS points
```

Restart n8n and the "NuRoute" node will appear in the node panel.

## Credentials

- **Base URL** — `https://nuroute.ai` (no trailing slash).
- **API Key** — an `aicp-*` key from your project's API Keys page. Org-wide or
  project-scoped keys both work.

## Node parameters

| Parameter | Description |
|-----------|-------------|
| Model | `auto` (recommended — NuRoute's routing engine picks the best model) or a specific model ID |
| Messages | One or more `{ role, content }` pairs — build a system prompt + conversation history |
| Simplify Output | On by default: returns `{ content, model, finishReason, usage }` instead of the raw API response |
| Additional Options → Temperature / Max Tokens / Provider | Optional — Provider pins a specific upstream provider; combine with Model `auto` to pick the best model from that provider |

## Documentation

Full documentation: [nuroute.ai/docs](https://nuroute.ai/docs)

How routing decisions are made: [nuroute.ai/docs/concepts/routing-performance](https://nuroute.ai/docs/concepts/routing-performance)

## License

MIT
