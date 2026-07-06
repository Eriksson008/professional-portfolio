# Ask Fredrik Worker

Cloudflare Worker backend for the portfolio's "Ask Fredrik" assistant. Runs entirely on the
**Workers Free** plan — no API keys, no secrets, no paid services. v1 validates requests and
returns a deterministic answer built from approved public portfolio facts; it is shaped so
**Workers AI** can slot in later without changing the frontend contract.

The frontend (`src/lib/askFredrik.ts`) already speaks this contract: when
`VITE_ASK_FREDRIK_API_URL` is set at build time it POSTs here first and silently falls back
to its static curated answers on any failure — the widget can never error out.

## API

```
POST /ask
Content-Type: application/json

{ "question": "string (required, 1–500 chars after trim)",
  "sessionId": "string (optional)",
  "page": "string (optional)" }

→ 200 { "answer": "string", "source": "fallback" }
→ 400 { "error": "..." }   invalid JSON, missing/empty/too-long question
→ 405 { "error": "..." }   non-POST on /ask
```

`GET /` is a health check. CORS is allowlisted to local development
(`http://localhost:*`, `http://127.0.0.1:*`) and the GitHub Pages origin
(`https://eriksson008.github.io`) — edit the allowlist at the top of `src/index.ts`.

## Install

```bash
cd cloudflare/ask-fredrik-worker
npm install
```

## Local development

```bash
npm run dev          # wrangler dev → http://localhost:8787 (no Cloudflare account needed)
```

Smoke test:

```bash
curl -s -X POST http://localhost:8787/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What does Fredrik do well?"}'
```

Type-check with `npm run check`.

## Deploy (Workers Free)

```bash
npx wrangler login   # one-time, opens the browser
npm run deploy
```

Wrangler prints the public URL, e.g. `https://ask-fredrik-worker.<your-subdomain>.workers.dev`.

## Pointing the frontend at the Worker

`VITE_ASK_FREDRIK_API_URL` is the **full endpoint URL including `/ask`**. It is a public
build-time URL — never a key or secret.

- **Local:** create `.env.local` in the repo root (gitignored) with
  `VITE_ASK_FREDRIK_API_URL=http://localhost:8787/ask` and restart `npm run dev`.
- **GitHub Pages:** set a repository **Actions variable** (Settings → Secrets and variables →
  Actions → Variables) named `VITE_ASK_FREDRIK_API_URL` to
  `https://ask-fredrik-worker.<your-subdomain>.workers.dev/ask`. The deploy workflow passes it
  into the build; leave it unset and the site keeps using static answers.

> **Hold off in v1:** the frontend's static keyword-matched answers are *better* than this
> Worker's single fallback answer. Don't set `VITE_ASK_FREDRIK_API_URL` in the Pages build
> until Workers AI is enabled below — otherwise every question gets the same generic reply.

## Upgrading to Workers AI (v2)

Workers AI has a free daily allocation on the Free plan. Three steps, no keys:

1. In `wrangler.jsonc`, add a comma after `"compatibility_date"` and uncomment:
   ```jsonc
   "ai": { "binding": "AI" }
   ```
2. In `src/index.ts`, add the binding and thread it through:
   ```ts
   interface Env {
     AI: Ai;
   }
   // fetch(request, env) → pass env to handleAsk, then:
   const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
     messages: [
       { role: 'system', content: `Answer only from these facts: ${JSON.stringify(APPROVED_CONTEXT)}` },
       { role: 'user', content: question },
     ],
   });
   // On success return { answer, source: 'ai' }; on any failure keep
   // returning FALLBACK_ANSWER with source 'fallback'.
   ```
3. Redeploy with `npm run deploy`.

The response contract (`{ answer, source }`) stays the same, so the frontend needs no changes.
