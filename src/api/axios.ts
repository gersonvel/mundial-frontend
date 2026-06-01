import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api'
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // SI LA URL INCLUYE '/auth/', NO SE ENVÍA EL TOKEN VIEJO
    if (token && config.url && !config.url.includes('/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;