import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import {
  getPointsBalance,
  getPointsHistory,
  syncPendingPoints,
  awardPoints,
  type PointAction,
} from '@/services/pointsService';

export function usePointsBalance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pointsBalance', user?.id],
    queryFn: () => getPointsBalance(user!.id),
    enabled: !!user,
  });
}

export function usePointsHistory(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pointsHistory', user?.id, limit],
    queryFn: () => getPointsHistory(user!.id, limit),
    enabled: !!user,
  });
}

export function usePointsSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    syncPendingPoints(user.id).then((synced) => {
      if (synced > 0) {
        queryClient.invalidateQueries({ queryKey: ['pointsBalance'] });
        queryClient.invalidateQueries({ queryKey: ['pointsHistory'] });
      }
    });
  }, [user?.id]);
}

export function useAwardPoints() {
  const queryClient = useQueryClient();

  return async (action: PointAction, reason: string, metadata?: Record<string, any>) => {
    const result = await awardPoints(action, reason, metadata);
    if (result.awarded) {
      queryClient.invalidateQueries({ queryKey: ['pointsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['pointsHistory'] });
    }
    return result;
  };
}
