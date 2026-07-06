-- Ask Fredrik question log. Apply with:
--   local dev : npx wrangler d1 execute ask-fredrik-db --local  --file=./schema.sql
--   production: npx wrangler d1 execute ask-fredrik-db --remote --file=./schema.sql
-- Privacy: raw IPs are never stored — only a salted SHA-256 hash, and only
-- when the IP_HASH_SALT secret is set.

CREATE TABLE IF NOT EXISTS ask_fredrik_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  source TEXT,
  matched_intent TEXT,
  session_id TEXT,
  page TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  model TEXT,
  latency_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ask_fredrik_logs_created_at
ON ask_fredrik_logs(created_at);
