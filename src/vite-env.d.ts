/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional future backend for the Ask Fredrik widget. Unset in v1
   * (GitHub Pages, static curated answers). Never a secret — build-time
   * public URL only.
   */
  readonly VITE_ASK_FREDRIK_API_URL?: string;

  /**
   * Optional override for the admin dashboard's API origin — used for local
   * dev (Vite on :8790 → wrangler dev on :8787). Falls back to the origin of
   * VITE_ASK_FREDRIK_API_URL, then to '' (same-origin: in production the
   * Worker serves the dashboard itself behind Cloudflare Access). Public URL
   * only — no secret is ever built in.
   */
  readonly VITE_ASK_FREDRIK_ADMIN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
