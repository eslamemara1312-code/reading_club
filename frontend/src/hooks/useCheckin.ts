import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logCheckin, getTodayStatus } from '../api/checkins';

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
