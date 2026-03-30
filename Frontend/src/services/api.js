import axios from "axios";

// ✅ URL Detection with Console Feedback
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  const fallbackURL = "https://sensechain.onrender.com";
  const finalURL = (envURL || fallbackURL).replace(/\/$/, "");
  
  // Isse aapko Vercel logs mein pata chal jayega ki link sahi hai ya nahi
  if (import.meta.env.DEV) {
    console.log(`🚀 SenseChain Dev Uplink: ${finalURL}`);
  }
  return finalURL;
};

const API_BASE_URL = getBaseURL();
let isRedirecting = false;

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 👈 60s: Render needs this to spin up from sleep
  headers: {
    "Content-Type": "application/json",
  }
});

// ✅ REQUEST INTERCEPTOR: Injecting Security Tokens
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sense_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug log for tracking cloud traffic
    if (import.meta.env.DEV) {
      console.log(`🛰️ Sending: ${config.method?.toUpperCase()} -> ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR: Handling Cloud-specific failures
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle Render "Cold Start" (Retry once if network fails)
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn("😴 Backend is sleeping. Attempting to wake up Sense Brain...");
      // Wait 3 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
      return API(originalRequest);
    }

    // 2. Handle Network/CORS/Offline
    if (!error.response) {
      return Promise.reject({
        message: "Sense Brain Link Failed. The neural node (Render) might be offline.",
        status: "OFFLINE",
      });
    }

    const { status } = error.response;

    // 3. Handle Session Expiry (Unauthorized)
    if ((status === 401 || status === 403) && !isRedirecting) {
      isRedirecting = true;
      console.error("🔒 Session Revoked. Re-routing to Terminal.");
      
      localStorage.clear();
      
      // Delay redirect slightly so user can see any error toast
      setTimeout(() => {
        window.location.href = "/login";
        isRedirecting = false;
      }, 1500);
      
      return Promise.reject({ message: "Access Denied", status });
    }

    return Promise.reject(error.response.data || { message: "Neural Link Error" });
  }
);

export default API;