// One place for backend URLs (the original app hard-coded them in 4 different files).
// Override with VITE_API_URL / VITE_ML_URL in .env — the FastAPI routes themselves are unchanged.
export const API_URL =
  import.meta.env.VITE_API_URL || "https://server-511b3f14.fastapicloud.dev";

export const ML_URL =
  import.meta.env.VITE_ML_URL || "https://server2-production-ce4d.up.railway.app";

export default API_URL;
