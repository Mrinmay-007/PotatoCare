import axios from "axios";
import { API_URL, ML_URL } from "./config";

// Main FastAPI backend: users, weather, treatment, logbook, translate.
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Model server: /detect/ and /predict/ (multipart uploads, can be slow on cold start).
export const mlApi = axios.create({
  baseURL: ML_URL,
  timeout: 90000,
  headers: { Accept: "application/json" },
});

// Turn any axios error into a readable message (FastAPI sends { detail }).
export function errorMessage(err, fallback = "Something went wrong.") {
  const data = err?.response?.data;
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return data?.message || fallback;
}

export default api;
