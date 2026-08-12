import { apiClient } from './client';

export interface ReaderBookmark { id: string; page_number: number; created_at: string; }
export interface ReaderNote { id: string; page_number: number; selected_text?: string | null; note_text: string; position_data?: Record<string, unknown> | null; created_at: string; updated_at: string; }
export interface ReaderHighlight { id: string; page_number: number; selected_text: string; color: string; position_data?: Record<string, unknown> | null; created_at: string; }

const path = (groupId: string, bookId: string, resource: string) => `/groups/${groupId}/books/${bookId}/${resource}`;

export const getReaderBookmarks = async (groupId: string, bookId: string) => (await apiClient.get<ReaderBookmark[]>(path(groupId, bookId, 'bookmarks'))).data;
export const createReaderBookmark = async (groupId: string, bookId: string, page_number: number) => (await apiClient.post<ReaderBookmark>(path(groupId, bookId, 'bookmarks'), { page_number })).data;
export const deleteReaderBookmark = async (groupId: string, bookId: string, id: string) => { await apiClient.delete(`${path(groupId, bookId, 'bookmarks')}/${id}`); };

export const getReaderNotes = async (groupId: string, bookId: string) => (await apiClient.get<ReaderNote[]>(path(groupId, bookId, 'notes'))).data;
export const createReaderNote = async (groupId: string, bookId: string, input: Pick<ReaderNote, 'page_number' | 'note_text'> & Partial<Pick<ReaderNote, 'selected_text' | 'position_data'>>) => (await apiClient.post<ReaderNote>(path(groupId, bookId, 'notes'), input)).data;
export const updateReaderNote = async (groupId: string, bookId: string, id: string, input: Partial<Pick<ReaderNote, 'note_text' | 'selected_text' | 'position_data'>>) => (await apiClient.patch<ReaderNote>(`${path(groupId, bookId, 'notes')}/${id}`, input)).data;
export const deleteReaderNote = async (groupId: string, bookId: string, id: string) => { await apiClient.delete(`${path(groupId, bookId, 'notes')}/${id}`); };

export const getReaderHighlights = async (groupId: string, bookId: string) => (await apiClient.get<ReaderHighlight[]>(path(groupId, bookId, 'highlights'))).data;
export const createReaderHighlight = async (groupId: string, bookId: string, input: Pick<ReaderHighlight, 'page_number' | 'selected_text'> & Partial<Pick<ReaderHighlight, 'color' | 'position_data'>>) => (await apiClient.post<ReaderHighlight>(path(groupId, bookId, 'highlights'), input)).data;
export const updateReaderHighlight = async (groupId: string, bookId: string, id: string, input: Partial<Pick<ReaderHighlight, 'color' | 'position_data'>>) => (await apiClient.patch<ReaderHighlight>(`${path(groupId, bookId, 'highlights')}/${id}`, input)).data;
export const deleteReaderHighlight = async (groupId: string, bookId: string, id: string) => { await apiClient.delete(`${path(groupId, bookId, 'highlights')}/${id}`); };
