import axios from "axios";

// Add console log to debug
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
console.log("API URL:", API_URL); // Add this line

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add token to all requests
api.interceptors.request.use(
  (config) => {
    console.log(
      `${config.method.toUpperCase()} ${config.baseURL}${config.url}`,
    ); // Add this
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log(`${response.config.url} - Status: ${response.status}`); // Add this
    return response;
  },
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

const AuthService = {
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      console.log("Registration response:", response.data);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log("Attempting login with:", {
        url: `${api.defaults.baseURL}/auth/login`,
        credentials: { email: credentials.email },
      });

      const response = await api.post("/auth/login", credentials);
      console.log("Login response:", response.data);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        },
      });
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/me");
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      console.error("Get user error:", error);
      return null;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  // Get stored user data
  getStoredUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Get token
  getToken: () => {
    return localStorage.getItem("token");
  },
};

export { api };
export default AuthService;
