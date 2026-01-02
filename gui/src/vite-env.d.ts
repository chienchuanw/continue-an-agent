/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HIDE_CREDITS_UI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
