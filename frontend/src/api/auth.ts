import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp_enabled?: boolean;
  avatar_url?: string;
  level: number;
  xp_points: number;
  current_frame: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const registerUser = async (data: { name: string; email: string; password: string; phone?: string }): Promise<TokenPair> => {
  const response = await apiClient.post<TokenPair>('/auth/register', data);
  return response.data;
};

export const loginUser = async (data: { email: string; password: string }): Promise<TokenPair> => {
  const response = await apiClient.post<TokenPair>('/auth/login', data);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};

