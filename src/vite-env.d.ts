/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional future backend for the Ask Fredrik widget. Unset in v1
   * (GitHub Pages, static curated answers). Never a secret — build-time
   * public URL only.
   */
  readonly VITE_ASK_FREDRIK_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
