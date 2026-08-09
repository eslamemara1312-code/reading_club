import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../api/checkins';

export const useLeaderboard = (groupId: string | null) => {
  return useQuery({
    queryKey: ['leaderboard', groupId],
    queryFn: () => getLeaderboard(groupId!),
    enabled: !!groupId,
  });
};
