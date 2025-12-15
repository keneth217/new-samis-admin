import axios from "axios";

// Base URLs (configure in .env)
// VITE_BASE_URL="https://officeapi.samis.co.ke/api" // prod (commented for now)
// VITE_BASE_URL="http://localhost:8083/api"          // local alt
// VITE_BASE_URL="http://DESKTOP-RPLDG13:8083/api"    // old desktop
// VITE_BASE_URL="http://DESKTOP-RPLDG13:8086/api"    // current target

const apiClient = axios.create({
  baseURL:
    (import.meta.env.MODE === "development"
      ? import.meta.env.VITE_BASE_URL
      : import.meta.env.VITE_BASE_URL) || "http://DESKTOP-RPLDG13:8086/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 90_000,
});

// Endpoints without extra headers
const NO_HEADERS_ENDPOINTS = ["/schools/register"];

// Auth-only endpoints (skip auth header)
const SCHOOL_ONLY_ENDPOINTS = ["/auth/signin"];

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Skip headers for excluded endpoints
    if (NO_HEADERS_ENDPOINTS.some((endpoint) => config.url?.includes(endpoint))) {
      return config;
    }

    const authToken = localStorage.getItem("authToken");
    const schoolCode = localStorage.getItem("schoolCode");

    if (schoolCode) {
      config.headers["X-School"] = schoolCode;
    }

    // Add auth token unless endpoint is auth-only
    if (!SCHOOL_ONLY_ENDPOINTS.some((endpoint) => config.url?.includes(endpoint))) {
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes("/auth/signin")) {
      const token = response.data?.token;
      if (token) {
        localStorage.setItem("authToken", token);
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        if (response.data?.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      delete apiClient.defaults.headers.common.Authorization;
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export const getAuthToken = () => localStorage.getItem("authToken");

export default apiClient;
