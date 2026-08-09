import { apiClient } from './client';
import { User } from './auth';

export interface MemberDayStatus {
  day: string;
  status: 'present' | 'absent' | 'freeze' | 'future' | 'not_joined';
  pages_read?: number;
  note?: string;
}

export interface MemberCalendarGrid {
  user: User;
  days: MemberDayStatus[];
}

export interface MonthCalendarResponse {
  group_id: string;
  month: string;
  members: MemberCalendarGrid[];
}

export const getGroupCalendar = async (groupId: string, monthStr?: string): Promise<MonthCalendarResponse> => {
  const url = monthStr ? `/groups/${groupId}/calendar?month=${monthStr}` : `/groups/${groupId}/calendar`;
  const response = await apiClient.get<MonthCalendarResponse>(url);
  return response.data;
};
