const DEFAULT_DEV_API_URL = "http://localhost:8000";
const DEFAULT_PROD_API_URL = "http://23.22.101.225:8000";

const configuredApiUrl = import.meta.env.VITE_API_URL_OVERRIDE?.trim();

export const API_URL = (
  configuredApiUrl ||
  (import.meta.env.PROD ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL)
).replace(/\/+$/, "");