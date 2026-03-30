import axios from "axios";

// ✅ Professional Way: Using Environment Variable with a safe fallback
// Trim is used to avoid accidental spaces in .env file
const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://sensechain.onrender.com").replace(/\/$/, "");

// Internal flags to prevent redirection loops
let isRedirecting = false;

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 👈 45s for cold starts on Render
  headers: {
    "Content-Type": "application/json",
  }
});

// ✅ REQUEST INTERCEPTOR: Token Attachment
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sense_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR: Global Error Handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Handle Network/Offline Errors (CORS or Server Down)
    if (!error.response) {
      console.error("Critical Node Failure: Backend unreachable at", API_BASE_URL);
      return Promise.reject({
        message: "Node Connection Failed. Check if Render service is Live.",
        status: "OFFLINE",
      });
    }

    const { status, data } = error.response;

    // 2. Handle Auth Failures (401/403)
    if ((status === 401 || status === 403) && !isRedirecting) {
      isRedirecting = true;
      console.warn("Session Expired: Redirecting to Terminal...");
      
      // Clear all auth data
      localStorage.clear(); // 👈 Pro Tip: clear() is safer than individual removeItems

      setTimeout(() => {
        window.location.href = "/login";
        isRedirecting = false;
      }, 800);
      
      return Promise.reject({ message: "Session Expired", status });
    }

    // 3. Handle Other Errors
    return Promise.reject(data || { message: "Internal Server Error" });
  }
);

export default API;