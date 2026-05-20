import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/verify-otp')
      || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Improve error message extraction
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'An unexpected error occurred';
    
    // Create a new error with better message
    const enhancedError = new Error(errorMessage);
    enhancedError.response = error.response;
    enhancedError.request = error.request;
    
    return Promise.reject(enhancedError);
  }
);

export default api;
