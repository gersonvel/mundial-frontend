import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://10.240.236.1677:8080/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    const esRutaLoginORegistro = config.url?.endsWith('/auth/login') || config.url?.endsWith('/auth/registro');

    if (token && token !== 'undefined' && token !== 'null' && !esRutaLoginORegistro) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;