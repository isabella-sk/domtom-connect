import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/authService";
import type { RegisterData, LoginData } from "../types/auth";

export const useAuth = () => {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setAuth,
    setLoading,
    logout: clearStore,
  } = useAuthStore();

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const result = await authService.register(data);
      setAuth(result.user, result.accessToken);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    setLoading(true);
    try {
      const result = await authService.login(data);
      setAuth(result.user, result.accessToken);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearStore();
    }
  };

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
  };
};
