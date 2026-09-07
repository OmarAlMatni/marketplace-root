import axios from 'axios';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
});

axiosClient.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 (bad/expired token) or 403 (banned / lost admin privileges) both
    // mean this session is no longer valid for the admin portal.
    if (error.response?.status === 401) {
      useAdminAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
