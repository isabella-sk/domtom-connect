export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  originTerritory: string;
  currentCity?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  message: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  originTerritory: string;
}

export interface LoginData {
  email: string;
  password: string;
}
