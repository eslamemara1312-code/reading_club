import axios from 'axios';

let rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
rawBase = rawBase.replace(/\/+$/, '');
if (rawBase.includes('railway.app') && rawBase.startsWith('http://')) {
  rawBase = rawBase.replace('http://', 'https://');
}
export const API_BASE_URL = rawBase.endsWith('/api/v1') ? rawBase : `${rawBase}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string> | null = null;

const clearExpiredSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
};

// Request interceptor to attach access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for token refresh handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        clearExpiredSession();
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          }).then((res) => {
            const { access_token, refresh_token, user } = res.data;
            localStorage.setItem('access_token', access_token);
            if (refresh_token) {
              localStorage.setItem('refresh_token', refresh_token);
            }
            if (user) {
              localStorage.setItem('user', JSON.stringify(user));
            }
            return access_token as string;
          }).finally(() => {
            refreshPromise = null;
          });
        }

        const accessToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearExpiredSession();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
