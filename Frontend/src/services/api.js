import axios from "axios";

// ✅ Smart URL Detection Logic
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  const renderURL = "https://sensechain.onrender.com";
  const localURL = "http://127.0.0.1:8000";

  // Check if we are running on Vercel/Production
  const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

  // Decide the best URL
  // Priority: 1. Env Var, 2. Auto-Production Detection, 3. Localhost Fallback
  let finalURL = envURL || (isProduction ? renderURL : localURL);
  
  finalURL = finalURL.replace(/\/$/, "");

  // 🚨 UI-Friendly Debugging
  if (isProduction) {
    console.log("%c🛰️ SENSE-CHAIN: CLOUD UPLINK ACTIVE -> " + finalURL, "color: #10b981; font-weight: bold;");
  } else {
    console.log("%c🛰️ SENSE-CHAIN: LOCALHOST DEVELOPMENT MODE", "color: orange; font-weight: bold;");
  }
  
  return finalURL;
};

const API_BASE_URL = getBaseURL();
let isRedirecting = false;

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, 
  headers: {
    "Content-Type": "application/json",
  }
});

// ✅ REQUEST INTERCEPTOR (Kept Original)
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

// ✅ RESPONSE INTERCEPTOR: Smart Recovery
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle Render Cold Start (Smart Retry)
    // If request fails due to timeout or network, and it's not a retry yet
    if ((error.code === 'ECONNABORTED' || !error.response) && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn("😴 Neural Node is sleeping. Initializing wake-up sequence...");
      
      // Wait 3s and try again (Render typically needs 15-30s)
      await new Promise(resolve => setTimeout(resolve, 3000));
      return API(originalRequest);
    }

    // 2. Node Offline Error
    if (!error.response) {
      return Promise.reject({
        message: "Neural Link Failed. Verify Render Node Status.",
        status: "OFFLINE",
      });
    }

    const { status } = error.response;

    // 3. Auth Guard (401/403)
    if ((status === 401 || status === 403) && !isRedirecting) {
      isRedirecting = true;
      console.error("🔒 Auth Token Revoked. Resetting Terminal...");
      
      localStorage.clear();
      
      setTimeout(() => {
        window.location.href = "/login";
        isRedirecting = false;
      }, 1000);
      
      return Promise.reject({ message: "Session Expired", status });
    }

    return Promise.reject(error.response.data || { message: "Neural Link Error" });
  }
);

export default API;