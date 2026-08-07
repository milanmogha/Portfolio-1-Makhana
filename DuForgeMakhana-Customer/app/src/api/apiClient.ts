// src/api/apiClient.ts
import axios from "axios";

// Env-driven so local dev (.env.development → http://localhost:5000) and
// production builds both work. Falls back to the production API.
const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5000/").replace(/\/$/, ""),
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
