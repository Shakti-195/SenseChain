import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

// Internal flags to prevent redirection loops
let isRedirecting = false;

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 👈 30s: Re-mining (Healing) can take time depending on difficulty
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
    // 1. Handle Network/Offline Errors
    if (!error.response) {
      console.error("Critical Node Failure: Backend is unreachable.");
      return Promise.reject({
        message: "Node Connection Failed. Check if FastAPI is running.",
        status: "OFFLINE",
      });
    }

    const { status, data } = error.response;

    // 2. Handle Auth Failures (401/403)
    if ((status === 401 || status === 403) && !isRedirecting) {
      isRedirecting = true;
      console.warn("Session Expired: Redirecting to Terminal Login...");
      
      localStorage.removeItem("sense_token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_name");

      setTimeout(() => {
        window.location.replace("/login");
        isRedirecting = false;
      }, 800);
      return Promise.reject({ message: "Session Expired" });
    }

    // 3. Handle Special Blockchain Errors (e.g., 400 Tamper Detected)
    // Inhe reject karna zaroori hai taaki Security.jsx ka catch block trigger ho
    return Promise.reject(data || error);
  }
);

export default API;