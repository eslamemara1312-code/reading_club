import { apiClient } from './client';
import { User } from './auth';

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_award: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

export interface WeeklyTitle {
  id: string;
  group_id: string;
  user_id: string;
  week_start_date: string;
  title_type: string;
  title_name: string;
  created_at: string;
  user: User;
}

export const getAllBadges = async (): Promise<Badge[]> => {
  const response = await apiClient.get<Badge[]>('/badges');
  return response.data;
};

export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  const response = await apiClient.get<UserBadge[]>(`/users/${userId}/badges`);
  return response.data;
};

export const getGroupTitles = async (groupId: string): Promise<WeeklyTitle[]> => {
  const response = await apiClient.get<WeeklyTitle[]>(`/groups/${groupId}/titles`);
  return response.data;
};

export const updateAvatarFrame = async (frame: string): Promise<User> => {
  const response = await apiClient.patch<User>('/users/me/frame', { current_frame: frame });
  return response.data;
};
