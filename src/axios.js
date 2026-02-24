import axios from "axios";

// Base URLs (configure in .env)
// VITE_BASE_URL="https://officeapi.samis.co.ke/api" // prod (commented for now)
// VITE_BASE_URL="http://localhost:8083/api"          // local alt
// VITE_BASE_URL="http://DESKTOP-RPLDG13:8083/api"    // old desktop
// VITE_BASE_URL="http://DESKTOP-RPLDG13:8086/api"    // current target

// In development: use '' so requests go to same-origin and Vite proxy forwards to API (avoids CORS)
// In production: use full API URL
const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_BASE_URL ??
    (import.meta.env.DEV ? "/api" : "https://officeapi.samis.co.ke/api"),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 90_000,
});

// Endpoints without extra headers
const NO_HEADERS_ENDPOINTS = ["/schools/register"];

// Auth-only endpoints (skip auth header and X-School header)
const AUTH_ONLY_ENDPOINTS = ["/auth/signin", "/auth/signup", "/auth/signout"];

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Skip headers for excluded endpoints
    if (NO_HEADERS_ENDPOINTS.some((endpoint) => config.url?.includes(endpoint))) {
      return config;
    }

    const authToken = localStorage.getItem("authToken");
    const schoolCode = localStorage.getItem("schoolCode");

    // Don't add X-School header for auth endpoints
    const isAuthEndpoint = AUTH_ONLY_ENDPOINTS.some((endpoint) => config.url?.includes(endpoint));
    
    if (schoolCode && !isAuthEndpoint) {
      config.headers["X-School"] = schoolCode;
    }

    // For auth endpoints, explicitly remove Authorization header to prevent stale tokens
    if (isAuthEndpoint) {
      delete config.headers.Authorization;
      delete config.headers["X-School"];
    } else {
      // Add auth token for non-auth endpoints
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
    }

    // Log request details for auth endpoints (for debugging)
    if (isAuthEndpoint) {
      const logData = { ...config.data };
      const passwordValue = logData.password;
      if (logData.password) {
        logData.password = "[REDACTED]";
      }
      // Log headers in a readable format
      const headersObj = {};
      if (config.headers) {
        Object.keys(config.headers).forEach(key => {
          headersObj[key] = config.headers[key];
        });
      }
      
      console.log("📡 Auth Request Interceptor:", {
        fullURL: `${config.baseURL}${config.url}`,
        method: config.method?.toUpperCase(),
        headers: headersObj,
        hasAuthorizationHeader: !!config.headers.Authorization,
        authorizationHeaderValue: config.headers.Authorization ? "[PRESENT]" : "[NOT PRESENT]",
        data: logData,
        actualPasswordLength: passwordValue?.length || 0,
        timeout: config.timeout,
      });
      
      // Also log to help with debugging - show what's actually being sent
      console.log("🔍 Request Payload Verification:", {
        phoneNo: config.data?.phoneNo,
        phoneNoType: typeof config.data?.phoneNo,
        phoneNoLength: config.data?.phoneNo?.length,
        passwordType: typeof config.data?.password,
        passwordLength: config.data?.password?.length,
        payloadKeys: Object.keys(config.data || {}),
      });
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
        // Store user data from response (API returns fields directly, not nested in 'user')
        if (response.data) {
          const userData = {
            id: response.data.id,
            username: response.data.username,
            phoneNo: response.data.phoneNo,
            fullname: response.data.fullname,
            roles: response.data.roles,
          };
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }
    }
    return response;
  },
  (error) => {
    // Log detailed error information for debugging
    if (error.response) {
      console.error("❌ API Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        method: error.config?.method,
        requestHeaders: error.config?.headers,
        requestData: error.config?.data ? {
          ...error.config.data,
          password: "[REDACTED]"
        } : null,
      });
      
      // For 500 errors, provide additional context and attach server message for UI
      if (error.response.status === 500) {
        const serverData = error.response.data;
        const serverMessage =
          typeof serverData === "string"
            ? serverData
            : serverData?.message || serverData?.error || serverData?.exception || (serverData && JSON.stringify(serverData));
        error.serverMessage = serverMessage || "Internal Server Error (no message from server)";
        console.error("🔴 500 SERVER ERROR - Request Details:", {
          endpoint: error.config?.url,
          fullURL: `${error.config?.baseURL}${error.config?.url}`,
          method: error.config?.method,
          requestPayload: error.config?.data ? {
            phoneNo: error.config.data.phoneNo,
            passwordLength: error.config.data.password?.length || 0,
          } : null,
          responseData: serverData,
          serverMessage: error.serverMessage,
          timestamp: new Date().toISOString(),
        });
        console.error("💡 This is a SERVER-SIDE error. Fix it on the backend (officeapi.samis.co.ke). Check server logs for the stack trace.");
      }
    } else if (error.request) {
      console.error("⚠️ API Request Error (No Response):", {
        message: error.message,
        url: error.config?.url,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
      });
    } else {
      console.error("❌ API Error:", error.message);
    }

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
