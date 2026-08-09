import { apiClient } from './client';

export interface Nudge {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  nudge_date: string;
  resulted_in_checkin: boolean;
  from_user_name?: string;
  to_user_name?: string;
}

export interface GroupStats {
  group_id: string;
  month: string;
  total_pages_read: number;
  total_checkins: number;
  total_members: number;
  monthly_page_goal: number | null;
  goal_progress_percent: number | null;
}

export interface HallOfFameEntry {
  title: string;
  user_id: string;
  user_name: string;
  value: string;
}

export interface MonthlySummary {
  id: string;
  user_id: string;
  group_id: string;
  month: string;
  stats: {
    commitment_rate: number;
    total_checkins: number;
    total_pages: number;
    days_in_month: number;
    longest_streak: number;
    total_fines: number;
  };
  generated_at: string;
}

export const sendNudge = async (groupId: string, toUserId: string): Promise<Nudge> => {
  const response = await apiClient.post<Nudge>('/nudges', {
    group_id: groupId,
    to_user_id: toUserId,
  });
  return response.data;
};

export const getGroupStats = async (groupId: string, month?: string): Promise<GroupStats> => {
  const params = month ? { month } : {};
  const response = await apiClient.get<GroupStats>(`/groups/${groupId}/stats`, { params });
  return response.data;
};

export const getHallOfFame = async (groupId: string): Promise<HallOfFameEntry[]> => {
  const response = await apiClient.get<HallOfFameEntry[]>(`/groups/${groupId}/hall-of-fame`);
  return response.data;
};

export const getMonthlySummary = async (month?: string, groupId?: string): Promise<MonthlySummary | null> => {
  const params: Record<string, string> = {};
  if (month) params.month = month;
  if (groupId) params.group_id = groupId;
  const response = await apiClient.get<MonthlySummary | null>('/users/me/summary', { params });
  return response.data;
};

export const updateGroupSettings = async (groupId: string, data: {
  fine_amount?: number;
  checkin_deadline_time?: string;
  grace_period_hours?: number;
  fun_mode_enabled?: boolean;
  monthly_page_goal?: number;
}): Promise<any> => {
  const response = await apiClient.patch(`/groups/${groupId}/settings`, data);
  return response.data;
};
