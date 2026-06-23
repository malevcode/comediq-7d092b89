// Supabase imports removed — mic status disabled to conserve egress until July 5

export type MicStatusType = 'verified' | 'unverified' | 'cancelled';

interface MicStatusData {
  status: MicStatusType;
  updatedAt: string;
}

// Mic status disabled to eliminate Supabase egress until billing cycle resets (July 5)
export const useMicStatus = (_micUniqueIdentifier: string) => {
  return {
    status: 'unverified' as MicStatusType,
    updatedAt: undefined,
    isLoading: false,
    updateStatus: (_newStatus: MicStatusType) => {},
    isUpdating: false,
  };
};
