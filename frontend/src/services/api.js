// // File: src/services/api.js
// import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken'); // Updated key here
//     console.log('Interceptor: Token found:', token); // Debug log to verify token
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export default apiClient;
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request Interceptor: Automatically attach JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // JWT Token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure correct headers for JSON and file uploads
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);

    // Handle Unauthorized (401) errors
    if (error.response?.status === 401) {
      console.warn('Unauthorized request. Redirecting to login...');
      localStorage.removeItem('authToken'); // Clear invalid token
      window.location.href = '/login'; // Redirect to login page
    }

    return Promise.reject(error);
  }
);

export default apiClient;
