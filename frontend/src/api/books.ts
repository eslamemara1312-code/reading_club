import { apiClient } from './client';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  total_pages: number;
  category?: string;
  created_at: string;
}

export interface GroupBook {
  id: string;
  group_id: string;
  book_id: string;
  start_date: string;
  target_end_date: string;
  daily_target_pages: number;
  status: 'active' | 'completed' | 'upcoming';
  created_at: string;
  book: Book;
}

export const getBooksCatalog = async (): Promise<Book[]> => {
  const response = await apiClient.get<Book[]>('/books');
  return response.data;
};

export const createBookInCatalog = async (book: { title: string; author: string; total_pages: number; category?: string; cover_url?: string }): Promise<Book> => {
  const response = await apiClient.post<Book>('/books', book);
  return response.data;
};

export const getActiveGroupBook = async (groupId: string): Promise<GroupBook | null> => {
  const response = await apiClient.get<GroupBook | null>(`/groups/${groupId}/books/active`);
  return response.data;
};

export const setGroupBookPlan = async (groupId: string, plan: { book_id: string; start_date: string; target_end_date: string }): Promise<GroupBook> => {
  const response = await apiClient.post<GroupBook>(`/groups/${groupId}/books`, plan);
  return response.data;
};

export const getAllGroupBooks = async (groupId: string): Promise<GroupBook[]> => {
  const response = await apiClient.get<GroupBook[]>(`/groups/${groupId}/books`);
  return response.data;
};

export const deleteGroupBook = async (groupId: string, groupBookId: string): Promise<void> => {
  await apiClient.delete(`/groups/${groupId}/books/${groupBookId}`);
};
