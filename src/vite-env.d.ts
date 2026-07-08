/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional future backend for the Ask Fredrik widget. Unset in v1
   * (GitHub Pages, static curated answers). Never a secret — build-time
   * public URL only.
   */
  readonly VITE_ASK_FREDRIK_API_URL?: string;

  /**
   * Optional override for the admin dashboard's API origin. Defaults to the
   * origin of VITE_ASK_FREDRIK_API_URL, so it's rarely needed. Public URL
   * only — the admin token is entered at runtime, never built in.
   */
  readonly VITE_ASK_FREDRIK_ADMIN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
