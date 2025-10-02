/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_TELEMETRY: string
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_SMITHERY_REGISTRY_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
