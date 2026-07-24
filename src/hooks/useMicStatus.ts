export type MicStatusType = 'verified' | 'unverified' | 'cancelled';

export const useMicStatus = (_micUniqueIdentifier: string) => {
  return {
    status: 'unverified' as MicStatusType,
    updatedAt: undefined,
    isLoading: false,
    updateStatus: (_newStatus: MicStatusType) => {},
    isUpdating: false,
  };
};
