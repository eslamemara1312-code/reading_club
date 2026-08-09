import { apiClient } from './client';
import { User } from './auth';

export interface Fine {
  id: string;
  user_id: string;
  group_id: string;
  fine_date: string;
  amount: number;
  status: 'pending' | 'paid';
  paid_at?: string;
  user?: User;
}

export interface FineVault {
  id: string;
  group_id: string;
  month: string;
  total_amount: number;
  status: 'open' | 'settled';
  settlement_note?: string;
  settled_at?: string;
  fines?: Fine[];
}

export const getGroupVault = async (groupId: string, monthStr?: string): Promise<FineVault> => {
  const url = monthStr ? `/groups/${groupId}/vault?month_str=${monthStr}` : `/groups/${groupId}/vault`;
  const response = await apiClient.get<FineVault>(url);
  return response.data;
};

export const settleVault = async (groupId: string, settlementNote: string, monthStr?: string): Promise<FineVault> => {
  const url = monthStr ? `/groups/${groupId}/vault/settle?month_str=${monthStr}` : `/groups/${groupId}/vault/settle`;
  const response = await apiClient.post<FineVault>(url, { settlement_note: settlementNote });
  return response.data;
};

export const markFinePaid = async (fineId: string): Promise<Fine> => {
  const response = await apiClient.patch<Fine>(`/fines/${fineId}/mark-paid`);
  return response.data;
};
