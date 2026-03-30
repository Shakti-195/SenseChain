import axios from "axios";

// ✅ Sabse pehle URL detect karo aur Console mein print karo
// Agar VITE_API_URL nahi mil raha toh direct Render URL use hoga
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  const fallbackURL = "https://sensechain.onrender.com";
  const finalURL = (envURL || fallbackURL).replace(/\/$/, "");
  
  console.log(`🚀 SenseChain Uplink initialized at: ${finalURL}`);
  return finalURL;
};

const API_BASE_URL = getBaseURL();

// Internal flags to prevent redirection loops
let isRedirecting = false;

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 👈 Increase to 60s (Render cold starts can be slow)
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
    // Debug: Har request ka full URL dekho console mein
    console.log(`🛰️ Outgoing Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
      console.error("❌ Node Failure: Backend unreachable at", API_BASE_URL);
      console.error("Possible Causes: 1. Render instance sleeping 2. CORS blockage 3. Mixed Content (HTTP on HTTPS)");
      return Promise.reject({
        message: "Node Connection Failed. Check Render Service.",
        status: "OFFLINE",
      });
    }

    const { status, data } = error.response;

    // 2. Handle Auth Failures (401/403)
    if ((status === 401 || status === 403) && !isRedirecting) {
      isRedirecting = true;
      console.warn("⚠️ Session Expired: Redirecting to Login...");
      
      localStorage.clear();

      setTimeout(() => {
        window.location.href = "/login";
        isRedirecting = false;
      }, 1000);
      
      return Promise.reject({ message: "Session Expired", status });
    }

    // 3. Handle Other Errors
    return Promise.reject(data || { message: "Internal Server Error" });
  }
);

export default API;