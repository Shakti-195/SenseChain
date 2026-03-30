import axios from "axios";

// ✅ UPDATED FOR RENDER DEPLOYMENT
// Render ka URL use kar rahe hain, backup ke liye localhost rakha hai
const API_BASE_URL = "https://sensechain.onrender.com";

// Internal flags to prevent redirection loops
let isRedirecting = false;

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 👈 45s: Cloud environment mein re-mining (Healing) mein thoda extra time lag sakta hai
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
      console.error("Critical Node Failure: Render Backend is unreachable.");
      return Promise.reject({
        message: "Node Connection Failed. Check if Render service is Live.",
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
        // Use window.location.href for a cleaner redirect in production
        window.location.href = "/login";
        isRedirecting = false;
      }, 800);
      return Promise.reject({ message: "Session Expired" });
    }

    // 3. Handle Special Blockchain Errors
    return Promise.reject(data || error);
  }
);

export default API;