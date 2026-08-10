import { apiClient } from './client';
import { User } from './auth';

export interface Checkin {
  id: string;
  user_id: string;
  group_id: string;
  checkin_date: string;
  pages_read?: number;
  note?: string;
  checked_in_at: string;
  is_late: boolean;
}

export interface MemberTodayStatus {
  user: User;
  has_checked_in: boolean;
  checkin?: Checkin;
  current_streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  commitment_rate: number;
  days_present: number;
  days_total: number;
  total_pages_read: number;
  current_streak: number;
  longest_streak: number;
}

export const logCheckin = async (data: { group_id: string; pages_read?: number; note?: string }): Promise<Checkin> => {
  const response = await apiClient.post<Checkin>('/checkins', data);
  return response.data;
};

export const getTodayStatus = async (groupId: string): Promise<MemberTodayStatus[]> => {
  const response = await apiClient.get<MemberTodayStatus[]>(`/checkins/today?group_id=${groupId}`);
  return response.data;
};

export const getLeaderboard = async (groupId: string): Promise<LeaderboardEntry[]> => {
  const response = await apiClient.get<LeaderboardEntry[]>(`/groups/${groupId}/leaderboard`);
  return response.data;
};

export const undoCheckin = async (groupId: string): Promise<void> => {
  await apiClient.delete(`/checkins/today?group_id=${groupId}`);
};

export const updateCheckin = async (data: { group_id: string; pages_read?: number; additional_pages?: number; note?: string }): Promise<Checkin> => {
  const response = await apiClient.patch<Checkin>('/checkins/today', data);
  return response.data;
};
