import { apiClient } from './client';
import { User } from './auth';

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'member';
  status: 'active' | 'left';
  joined_at: string;
  user: User;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  checkin_deadline_time: string;
  grace_period_hours: number;
  fine_amount: number;
  currency: string;
  fun_mode_enabled: boolean;
  monthly_page_goal?: number;
  created_at: string;
  members_count: number;
  members?: GroupMember[];
}

export const createGroup = async (data: { name: string; fine_amount?: number; monthly_page_goal?: number }): Promise<Group> => {
  const response = await apiClient.post<Group>('/groups', data);
  return response.data;
};

export const joinGroup = async (inviteCode: string): Promise<Group> => {
  const response = await apiClient.post<Group>('/groups/join', { invite_code: inviteCode });
  return response.data;
};

export const getGroupDetails = async (groupId: string): Promise<Group> => {
  const response = await apiClient.get<Group>(`/groups/${groupId}`);
  return response.data;
};
