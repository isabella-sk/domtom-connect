import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const req = error.config as any;
    if (
      error.response?.status === 401 &&
      !req._retry &&
      !req.url?.includes("/auth/refresh") &&
      !req.url?.includes("/auth/login")
    ) {
      req._retry = true;
      try {
        const { data } = await api.post("/auth/refresh");
        useAuthStore.getState().setAuth(data.user, data.accessToken);
        req.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(req);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
