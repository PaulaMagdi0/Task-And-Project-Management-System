import axios from "axios";

// Base API configurations with enhanced defaults
const API_CONFIG = {
  main: {
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
    timeout: 10000,
    withCredentials: true, // Ensures cookies are sent with requests
  },
  ai: {
    baseURL: import.meta.env.VITE_AI_BASE_URL || "http://127.0.0.1:8000/ai",
    timeout: 30000,
    withCredentials: true,
  },
};

// Debugging utility
const debugRequest = (config, type) => {
  if (import.meta.env.DEV) {
    console.groupCollapsed(
      `[${type.toUpperCase()}] ${config.method?.toUpperCase()} ${config.url}`
    );
    console.log("Request Config:", config);
    console.groupEnd();
  }
  return config;
};

const debugResponse = (response, type) => {
  if (import.meta.env.DEV) {
    console.groupCollapsed(
      `[${type.toUpperCase()}] Response: ${response.status} ${
        response.config.url
      }`
    );
    console.log("Response Data:", response.data);
    console.log("Full Response:", response);
    console.groupEnd();
  }
  return response;
};

const debugError = (error, type) => {
  if (import.meta.env.DEV) {
    console.groupCollapsed(
      `[${type.toUpperCase()}] Error: ${
        error.response?.status || "No Response"
      } ${error.config?.url}`
    );
    console.log("Error Details:", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      stack: error.stack,
    });
    console.groupEnd();
  }
  return Promise.reject(error);
};

// Create axios instances with enhanced interceptors
const createApiClient = (type = "main") => {
  const client = axios.create(API_CONFIG[type]);

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers["X-API-Version"] = type === "ai" ? "ai-1.0" : "v1.0";
      config.headers["X-Request-ID"] = window.crypto.randomUUID();

      return debugRequest(config, type);
    },
    (error) => debugError(error, type)
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => debugResponse(response, type),
    (error) => {
      const status = error.response?.status;
      const message =
        error.response?.data?.message || error.message || "API request failed";

      if (status === 401) {
        localStorage.removeItem("authToken");
        window.dispatchEvent(
          new CustomEvent("unauthorized", {
            detail: { message: "Session expired" },
          })
        );
      }

      return debugError(
        {
          ...error,
          status,
          message,
          data: error.response?.data,
        },
        type
      );
    }
  );

  return client;
};

// Configured clients
export const apiClient = createApiClient("main");
export const aiApiClient = createApiClient("ai");

// Utility function for API calls
export const apiRequest = async (client, config) => {
  try {
    const response = await client(config);
    return response.data;
  } catch (error) {
    // Transform error for consistent handling
    throw {
      status: error.status || 500,
      message: error.message,
      data: error.data,
      isApiError: true,
    };
  }
};

export default apiClient;
