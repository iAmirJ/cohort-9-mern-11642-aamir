import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create Axios instance
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important for HttpOnly cookies (refreshToken)
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // If the original request was to refresh token, and it failed with 401, logout
      if (originalRequest.url === '/auth/refresh') {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh API
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        
        const newAccessToken = data.data.accessToken;
        
        // Update store with new token
        useAuthStore.getState().setToken(newAccessToken);
        
        // Process queued requests
        processQueue(null, newAccessToken);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout(); // Refresh failed, force logout
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
