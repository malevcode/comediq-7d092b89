// Disabled to eliminate Supabase egress until billing cycle resets (July 5)
export const useLatestVerification = (_micUniqueIdentifier?: string) => {
  return {
    latestVerification: null,
    isLoading: false,
    invalidate: () => {},
  };
};
