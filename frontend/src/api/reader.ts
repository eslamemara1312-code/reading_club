import { apiClient } from './client';

export interface BookAsset {
  id: string;
  group_id: string;
  book_id: string;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  uploaded_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  group_id: string;
  book_id: string;
  book_asset_id: string;
  current_page: number;
  total_pages?: number | null;
  progress_percent?: number | null;
  last_read_at: string;
  created_at: string;
  updated_at: string;
}

export interface BookAssetWithProgress {
  has_asset: boolean;
  asset?: BookAsset | null;
  progress?: ReadingProgress | null;
}

export interface ReaderUrlResponse {
  url: string;
  expires_in_seconds: number;
  book_asset_id: string;
}

export const uploadSharedBookAsset = async (
  groupId: string,
  bookId: string,
  file: File
): Promise<BookAsset> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<BookAsset>(
    `/groups/${groupId}/books/${bookId}/asset`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const getBookAssetMetadata = async (
  groupId: string,
  bookId: string
): Promise<BookAssetWithProgress> => {
  const response = await apiClient.get<BookAssetWithProgress>(
    `/groups/${groupId}/books/${bookId}/asset`
  );
  return response.data;
};

export const getAuthorizedReaderUrl = async (
  groupId: string,
  bookId: string
): Promise<ReaderUrlResponse> => {
  const response = await apiClient.get<ReaderUrlResponse>(
    `/groups/${groupId}/books/${bookId}/reader-url`
  );
  return response.data;
};

export const deleteSharedBookAsset = async (
  groupId: string,
  bookId: string
): Promise<void> => {
  await apiClient.delete(`/groups/${groupId}/books/${bookId}/asset`);
};

export const getReadingProgress = async (
  groupId: string,
  bookId: string
): Promise<ReadingProgress> => {
  const response = await apiClient.get<ReadingProgress>(
    `/groups/${groupId}/books/${bookId}/progress`
  );
  return response.data;
};

export const updateReadingProgress = async (
  groupId: string,
  bookId: string,
  currentPage: number,
  totalPages?: number
): Promise<ReadingProgress> => {
  const response = await apiClient.put<ReadingProgress>(
    `/groups/${groupId}/books/${bookId}/progress`,
    {
      current_page: currentPage,
      total_pages: totalPages,
    }
  );
  return response.data;
};
