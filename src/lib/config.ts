/**
 * Application environment configuration.
 * Automatically switches between local development and production deployment.
 */

export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_API_URL) ||
  "http://127.0.0.1:8000";
