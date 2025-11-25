import { useQuery } from '@tanstack/react-query';
import { checkHostStatus } from '@/api/signups';
import { useAuth } from '@/contexts/AuthContext';

export function useHostStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hostStatus', user?.id],
    queryFn: () => checkHostStatus(user!.id),
    enabled: !!user,
  });
}
