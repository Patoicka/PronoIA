/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Solo desarrollo. `false` desactiva mocks de "Kronos en números". Ignorado en PROD. */
  readonly VITE_USE_MOCK_DASHBOARD_STATS?: string;
}
