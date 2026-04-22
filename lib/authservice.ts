import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = "https://auth.thevorld.com/api/v1";
const VORLD_APP_ID =  "app_mgs5crer_51c332b3";

// Generate or retrieve device ID for token binding
function getDeviceId(): string {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    // Return a temporary device ID for SSR
    return `device_ssr_${Date.now()}`;
  }
  
  let deviceId = localStorage.getItem("vorld_device_id");
  if (!deviceId) {
    // Generate a unique device ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("vorld_device_id", deviceId);
  }
  return deviceId;
}

export class VorldAuthService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "x-vorld-app-id": VORLD_APP_ID,
      "x-vorld-platform": "web",
      "x-vorld-device-id": getDeviceId(),
    },
    withCredentials: true,
  });

  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    // Add request interceptor to include auth token and device ID
    this.api.interceptors.request.use(
      (config) => {
        // Only access localStorage in browser environment
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("authToken");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        // Ensure device ID is always included
        config.headers["x-vorld-device-id"] = getDeviceId();
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh on 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Only access localStorage in browser environment
            if (typeof window === "undefined") {
              throw new Error("Cannot refresh token during SSR");
            }
            
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            const newTokens = await this.refreshToken(refreshToken);
            if (newTokens.success && newTokens.data && typeof window !== "undefined") {
              // Update tokens
              localStorage.setItem("authToken", newTokens.data.accessToken);
              localStorage.setItem("refreshToken", newTokens.data.refreshToken);

              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${newTokens.data.accessToken}`;

              // Process queued requests
              this.processQueue(null, newTokens.data.accessToken);

              return this.api(originalRequest);
            } else {
              throw new Error("Token refresh failed");
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and process queue with error
            if (typeof window !== "undefined") {
              localStorage.removeItem("authToken");
              localStorage.removeItem("refreshToken");
            }
            this.processQueue(refreshError, null);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  // DEPRECATED: Email/Password Authentication (will be removed Jun 2026)
  // Use passwordless OTP authentication instead
  async loginWithEmail(email: string, password: string) {
    console.warn(
      "loginWithEmail is deprecated. Use passwordless OTP authentication instead."
    );
    try {
      const response = await this.api.post("/auth/login", {
        email,
        password,
      });
      console.log("response:", response);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  }

  // DEPRECATED: Use loginWithEmailOTP instead
  async verifyOTP(email: string, otp: string) {
    console.warn(
      "verifyOTP is deprecated. Use loginWithEmailOTP instead."
    );
    try {
      const response = await this.api.post("/auth/verify-otp", {
        email,
        otp,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "OTP verification failed",
      };
    }
  }

  async getProfile() {
    try {
      // Only access localStorage in browser environment
      if (typeof window === "undefined") {
        return {
          success: false,
          error: "Cannot get profile during SSR",
        };
      }
      
      const token = localStorage.getItem("authToken");
      console.log("Auth token found:", !!token);
      console.log("Token value:", token ? `${token.slice(0, 10)}...` : "null");

      if (!token) {
        return {
          success: false,
          error: "No authentication token found. Please login again.",
        };
      }

      const response = await this.api.get("/user/profile");
      console.log("profile response:", response);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error("Profile fetch error:", error);
      console.error("Error response:", error.response);

      // Token refresh is handled by interceptor, but if it fails completely:
      if (error.response?.status === 401) {
        return {
          success: false,
          error: "Token expired - Please login again",
        };
      }
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || "Failed to get profile",
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    const token = localStorage.getItem("authToken");
    return !!token;
  }

  // Logout user - calls API to revoke tokens
  async logout(): Promise<void> {
    try {
      if (typeof window === "undefined") {
        return;
      }
      
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          await this.api.post("/auth/logout", {
            refreshToken,
          });
        } catch (error) {
          // Even if API call fails, clear local tokens
          console.warn("Logout API call failed, but clearing local tokens:", error);
        }
      }
    } catch (error) {
      console.warn("Error during logout:", error);
    } finally {
      // Always clear local tokens (only in browser)
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
      }
    }
  }

  // Passwordless Email OTP Authentication

  // Step 1: Send OTP to user's email
  async sendEmailOTP(email: string) {
    try {
      const response = await this.api.post("/auth/send-email-otp", {
        email,
      });

      return {
        success: true,
        message: response.data.message || "OTP sent successfully",
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to send OTP";
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        return {
          success: false,
          error: "Rate limited. Please wait 60 seconds before requesting another OTP.",
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Step 2: Verify OTP and login (creates user if new)
  async loginWithEmailOTP(email: string, otp: string) {
    try {
      // Ensure device ID is included in headers
      const deviceId = getDeviceId();
      
      const response = await this.api.post(
        "/auth/verify-email-otp-login",
        {
          email,
          otp,
        },
        {
          headers: {
            "x-vorld-device-id": deviceId,
            "x-vorld-platform": "web",
          },
        }
      );

      // Store tokens in cookies
      if (response.data.data?.accessToken) {
        Cookies.set("accessToken", response.data.data.accessToken, {
          expires: 1, // 1 day
        });
        Cookies.set("refreshToken", response.data.data.refreshToken, {
          expires: 30, // 30 days
        });
      }

      // Also store in localStorage for compatibility with existing code
      if (response.data.data?.accessToken && typeof window !== "undefined") {
        localStorage.setItem("authToken", response.data.data.accessToken);
        localStorage.setItem("refreshToken", response.data.data.refreshToken);
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "OTP verification failed";

      // Handle account lockout
      if (error.response?.status === 429) {
        return {
          success: false,
          error: "Account locked. Too many failed attempts. Please wait 15 minutes.",
        };
      }

      // Handle invalid/expired OTP
      if (error.response?.status === 400) {
        return {
          success: false,
          error: "Invalid or expired OTP. Please request a new code.",
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Refresh access token using refresh token
  async refreshToken(refreshToken: string) {
    try {
      const deviceId = getDeviceId();
      
      const response = await this.api.post(
        "/auth/refresh",
        {
          refreshToken,
        },
        {
          headers: {
            "x-vorld-device-id": deviceId,
            "x-vorld-platform": "web",
          },
        }
      );

      // Update stored tokens
      if (response.data.data?.accessToken && typeof window !== "undefined") {
        localStorage.setItem("authToken", response.data.data.accessToken);
        localStorage.setItem("refreshToken", response.data.data.refreshToken);
        
        Cookies.set("accessToken", response.data.data.accessToken, {
          expires: 1,
        });
        Cookies.set("refreshToken", response.data.data.refreshToken, {
          expires: 30,
        });
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      // If refresh fails, clear tokens (only in browser)
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
      }

      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Token refresh failed",
      };
    }
  }
}
