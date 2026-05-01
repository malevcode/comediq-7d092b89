import { useQuery } from '@tanstack/react-query';
import { fetchAudienceShows, fetchFeaturedShows, AudienceShowFilters } from '@/api/pb/audienceShows';

export function useAudienceShows(filters?: AudienceShowFilters) {
  return useQuery({
    queryKey: ['audienceShows', filters],
    queryFn: () => fetchAudienceShows(filters),
  });
}

export function useFeaturedShows() {
  return useQuery({
    queryKey: ['featuredShows'],
    queryFn: fetchFeaturedShows,
  });
}
