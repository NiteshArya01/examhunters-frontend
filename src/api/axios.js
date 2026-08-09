import axios from 'axios';

const API = axios.create({
  // .env फाइल से Base URL लोड किया गया है
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// हर Request के साथ JWT Token भेजने के लिए Interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;