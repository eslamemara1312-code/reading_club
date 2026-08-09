import { apiClient } from './client';
import { User } from './auth';

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'reminder_warning' | 'badge_unlocked' | 'fine_issued' | 'weekly_title';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const getMyNotifications = async (): Promise<AppNotification[]> => {
  const response = await apiClient.get<AppNotification[]>('/notifications');
  return response.data;
};

export const markNotificationRead = async (id: string): Promise<AppNotification> => {
  const response = await apiClient.patch<AppNotification>(`/notifications/${id}/read`);
  return response.data;
};

export const updateWhatsAppSettings = async (phone: string, whatsapp_enabled: boolean): Promise<User> => {
  const response = await apiClient.patch<User>('/users/me/whatsapp', { phone, whatsapp_enabled });
  return response.data;
};
