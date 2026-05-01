import axios from 'axios';

let apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Safety check: If the URL doesn't start with http, it's treated as relative by the browser.
// We force it to be absolute if it looks like a domain.
if (apiBaseUrl && !apiBaseUrl.startsWith('http') && apiBaseUrl.includes('.')) {
  apiBaseUrl = `https://${apiBaseUrl}`;
}

const api = axios.create({
  baseURL: apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`,
});

// Add a request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
