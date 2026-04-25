import axios from "axios";

const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_BASE_URL;
  const renderURL = "https://sensechain.onrender.com";
  const localURL = "http://127.0.0.1:8000";

  const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

  let finalURL = envURL || (isProduction ? renderURL : localURL);
  finalURL = finalURL.replace(/\/$/, "");

  console.log(
    `%c🛰️ API UPLINK: ${finalURL}`,
    `color: ${isProduction ? "#10b981" : "#f59e0b"}; font-weight: bold;`
  );

  return finalURL;
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 50000, // 50s — Google Deep Search can take up to 40s via SerpAPI
  headers: { "Content-Type": "application/json" },
});

// ✅ ATTACH SENSE TOKEN
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("sense_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

let isRedirecting = false;

// ✅ PRODUCTION RETRY & AUTH INTERCEPTOR
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    originalRequest._retryCount = originalRequest._retryCount || 0;

    // 1. HANDLE COLD START (Retry logic)
    if ((!error.response || error.code === "ECONNABORTED") && originalRequest._retryCount < 3) {
      originalRequest._retryCount += 1;
      const delay = 2000 * originalRequest._retryCount;
      console.warn(`⚡ Backend waking up... Retry ${originalRequest._retryCount}/3 in ${delay}ms`);
      
      await new Promise(res => setTimeout(res, delay));
      return API(originalRequest);
    }

    // 2. HANDLE AUTH EXPIRATION
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (!isRedirecting) {
        isRedirecting = true;
        console.error("🔒 Security Token Expired. Logging out...");
        localStorage.removeItem("sense_token");
        setTimeout(() => {
          window.location.href = "/login";
          isRedirecting = false;
        }, 1500);
      }
      return Promise.reject({ message: "Unauthorized access" });
    }

    // 3. STRUCTURED ERROR RETURN
    const errorData = error.response ? error.response.data : { message: "Network connection lost." };
    return Promise.reject(errorData);
  }
);

export default API;