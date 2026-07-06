# Ask Fredrik Worker

Cloudflare Worker backend for the portfolio's "Ask Fredrik" assistant. Runs entirely on the
**Workers Free + D1 Free** plans — no API keys in code, no paid services. v1 validates
requests, returns a deterministic answer built from approved public portfolio facts, and
logs valid questions to **D1** so recruiter questions can be reviewed. It is shaped so
**Workers AI** can slot in later without changing the frontend contract.

The frontend (`src/lib/askFredrik.ts`) already speaks this contract: when
`VITE_ASK_FREDRIK_API_URL` is set at build time it POSTs here first and silently falls back
to its static curated answers on any failure — the widget can never error out, with or
without this Worker or its database.

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

GET /admin/logs[?limit=25|50|100]        (default 100, max 100)
Authorization: Bearer <ADMIN_TOKEN>

→ 200 { "count": n, "logs": [...] }
→ 401 { "error": "Unauthorized." }       missing/wrong token
→ 503 { "error": "..." }                 ADMIN_TOKEN or D1 not configured
```

`GET /` is a health check. CORS on `/ask` is allowlisted to local development
(`http://localhost:*`, `http://127.0.0.1:*`) and the GitHub Pages origin
(`https://eriksson008.github.io`) — edit the allowlist at the top of `src/index.ts`.
`/admin/logs` sends **no** CORS headers at all: it's a curl/CLI endpoint and can never be
read by a browser page on another origin.

## Install

```bash
cd cloudflare/ask-fredrik-worker
npm install
```

## D1 logging

Every valid `/ask` question is logged (id, timestamp, question, answer, source, session id,
page, referrer, user agent, salted IP hash, latency). Logging is **best-effort and
off the response path**: it runs after the answer is returned (`ctx.waitUntil`), and any
insert failure is a `console.warn`, never a user-facing error. If the D1 binding or a
secret is missing, the Worker still answers — it just logs less (or nothing).

**Privacy:** questions may be logged — the widget tells users not to submit sensitive
information. Raw IP addresses are **never** stored; only a salted SHA-256 hash, and only
when the `IP_HASH_SALT` secret is set.

### Create the database (one-time, production)

```bash
npx wrangler login                       # if not already
npx wrangler d1 create ask-fredrik-db
```

Copy the `database_id` it prints into `wrangler.jsonc` (replacing
`REPLACE_WITH_YOUR_DATABASE_ID`). The binding is already declared there:

```jsonc
"d1_databases": [
  { "binding": "ASK_FREDRIK_DB", "database_name": "ask-fredrik-db", "database_id": "<paste>" }
]
```

### Apply the schema

```bash
npx wrangler d1 execute ask-fredrik-db --local  --file=./schema.sql   # local dev database
npx wrangler d1 execute ask-fredrik-db --remote --file=./schema.sql   # production database
```

### Set the secrets (production)

```bash
npx wrangler secret put ADMIN_TOKEN     # long random string — protects GET /admin/logs
npx wrangler secret put IP_HASH_SALT    # long random string — salts the IP hash
```

Generate values with e.g. `openssl rand -hex 32`. If `ADMIN_TOKEN` is unset, `/admin/logs`
returns 503; if `IP_HASH_SALT` is unset, `ip_hash` is simply not stored. Secrets never
appear in code, config, or the frontend bundle.

### Local secrets

For `wrangler dev`, put local-only values in `.dev.vars` (gitignored, never commit):

```
ADMIN_TOKEN=dev-admin-token
IP_HASH_SALT=dev-salt
```

## Local development

```bash
npx wrangler d1 execute ask-fredrik-db --local --file=./schema.sql   # once
npm run dev          # wrangler dev → http://localhost:8787
```

Test `/ask`:

```bash
curl -s -X POST http://localhost:8787/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What does Fredrik do well?","sessionId":"demo","page":"/"}'
```

Test `/admin/logs` (token from `.dev.vars`):

```bash
curl -s http://localhost:8787/admin/logs?limit=25 \
  -H "Authorization: Bearer dev-admin-token"
```

Inspect the local database directly:

```bash
npx wrangler d1 execute ask-fredrik-db --local \
  --command "SELECT created_at, question, ip_hash FROM ask_fredrik_logs ORDER BY created_at DESC LIMIT 10"
```

Type-check with `npm run check`.

## Deploy (Workers Free)

```bash
npx wrangler login   # one-time, opens the browser
npm run deploy
```

Wrangler prints the public URL, e.g. `https://ask-fredrik-worker.<your-subdomain>.workers.dev`.
Then query production logs with:

```bash
curl -s "https://ask-fredrik-worker.<your-subdomain>.workers.dev/admin/logs?limit=50" \
  -H "Authorization: Bearer <your ADMIN_TOKEN>"
```

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

1. In `wrangler.jsonc`, add a comma after the `d1_databases` block and uncomment:
   ```jsonc
   "ai": { "binding": "AI" }
   ```
2. In `src/index.ts`, add `AI: Ai;` to the `Env` interface, then in `handleAsk` replace the
   `FALLBACK_ANSWER` constant with a guarded call:
   ```ts
   const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
     messages: [
       { role: 'system', content: `Answer only from these facts: ${JSON.stringify(APPROVED_CONTEXT)}` },
       { role: 'user', content: question },
     ],
   });
   // On success return { answer, source: 'ai' } and log model + matchedIntent;
   // on any failure keep returning FALLBACK_ANSWER with source 'fallback'.
   ```
3. Redeploy with `npm run deploy`.

The response contract (`{ answer, source }`) stays the same, so the frontend needs no
changes — and the log schema already has `model`, `source`, and `matched_intent` columns
waiting.
