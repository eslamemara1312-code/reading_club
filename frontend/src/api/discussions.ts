import { apiClient } from './client';
import { User } from './auth';

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: User;
}

export interface Discussion {
  id: string;
  group_id: string;
  user_id: string;
  group_book_id?: string;
  title: string;
  content: string;
  discussion_date: string;
  created_at: string;
  user: User;
  replies: DiscussionReply[];
}

export const getGroupDiscussions = async (groupId: string): Promise<Discussion[]> => {
  const response = await apiClient.get<Discussion[]>(`/groups/${groupId}/discussions`);
  return response.data;
};

export const createDiscussionThread = async (groupId: string, data: { title: string; content: string; group_book_id?: string }): Promise<Discussion> => {
  const response = await apiClient.post<Discussion>(`/groups/${groupId}/discussions`, data);
  return response.data;
};

export const addDiscussionReply = async (discussionId: string, content: string): Promise<DiscussionReply> => {
  const response = await apiClient.post<DiscussionReply>(`/discussions/${discussionId}/replies`, { content });
  return response.data;
};
