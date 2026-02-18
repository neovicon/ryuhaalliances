import axios from 'axios';

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: false });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 errors globally - only redirect to login for auth endpoints
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const url = error.config?.url || '';
      // Only auto-redirect for auth-related endpoints, not reactions/comments/etc.
      const isAuthEndpoint = url.includes('/auth/') || url.includes('/users/me');
      if (isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
