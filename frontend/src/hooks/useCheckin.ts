import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logCheckin, getTodayStatus, undoCheckin, updateCheckin } from '../api/checkins';

export const useTodayStatus = (groupId: string | null) => {
  return useQuery({
    queryKey: ['todayStatus', groupId],
    queryFn: () => getTodayStatus(groupId!),
    enabled: !!groupId,
  });
};

export const useCheckinMutation = (groupId: string | null) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { pages_read?: number; note?: string }) => {
      if (!groupId) throw new Error('No group selected');
      return logCheckin({ group_id: groupId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayStatus', groupId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', groupId] });
    },
  });
};

export const useUndoCheckinMutation = (groupId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!groupId) throw new Error('No group selected');
      return undoCheckin(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayStatus', groupId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', groupId] });
    },
  });
};

export const useUpdateCheckinMutation = (groupId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { pages_read?: number; additional_pages?: number; note?: string }) => {
      if (!groupId) throw new Error('No group selected');
      return updateCheckin({ group_id: groupId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayStatus', groupId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', groupId] });
    },
  });
};
