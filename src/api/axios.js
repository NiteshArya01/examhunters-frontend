import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', // अपना सही URL रखें
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (टोकन भेजने के लिए)
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (Session Out हैंडल करने के लिए)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Storage क्लियर करें
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // अगर यूज़र पहले से लॉगिन पेज पर नहीं है, तो भेज दें
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

export default API;