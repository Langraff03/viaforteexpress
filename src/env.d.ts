/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ENABLE_LOGS: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}