import axios from 'axios';
import BASE_URL from '../../constants/api';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for logging errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('CRITICAL: Axios Timeout (10s) reached. Server did not respond.');
    } else if (!error.response) {
      console.error('CRITICAL: Network Error / ECONNREFUSED. Backend might be down or unreachable at:', BASE_URL);
      console.log('Error Details:', error.message);
    } else {
      console.error(`API Error (${error.response.status}):`, error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
