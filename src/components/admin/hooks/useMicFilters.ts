import { useMemo } from 'react';

export interface MicFilters {
  borough: string;
  day: string;
  cost: string;
  verifiedFrom: Date | null;
  verifiedTo: Date | null;
}

export interface SortConfig {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Helper function to check if mic is free
export const isMicFree = (mic: any) => {
  const cost = mic['Cost']?.toLowerCase() || '';
  return cost.includes('free') || cost === '0' || cost === '$0';
};

// Helper function to parse verification date
export const parseVerificationDate = (mic: any) => {
  const verified = mic['Last verified'] || '';
  // Try to extract date from verification string (e.g., "Verified 12.25 Admin")
  const dateMatch = verified.match(/(\d{1,2})\.(\d{1,2})/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1; // 0-based month
    const day = parseInt(dateMatch[2]);
    const year = new Date().getFullYear();
    return new Date(year, month, day);
  }
  return null;
};

export const useMicFilters = (
  mics: any[],
  search: string,
  activeTab: string,
  filters: MicFilters,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
) => {
  return useMemo(() => {
    let filtered = mics.filter(mic => {
      const s = search.toLowerCase();
      const matchesSearch = (
        mic['Open Mic']?.toLowerCase().includes(s) ||
        mic['Venue Name']?.toLowerCase().includes(s) ||
        mic['Borough']?.toLowerCase().includes(s)
      );
      
      // Filter by active status based on current tab
      const matchesStatus = activeTab === 'active' ? (mic.active === true || mic.active === 1) : (mic.active !== true && mic.active !== 1);
      
      // Filter by borough
      const matchesBorough = filters.borough === 'all' || mic['Borough']?.trim() === filters.borough;
      
      // Filter by day
      const matchesDay = filters.day === 'all' || mic['Day']?.trim() === filters.day;
      
      // Filter by cost
      const matchesCost = filters.cost === 'all' || 
        (filters.cost === 'free' && isMicFree(mic)) ||
        (filters.cost === 'paid' && !isMicFree(mic));
      
      // Filter by verification date range
      let matchesVerification = true;
      if (filters.verifiedFrom || filters.verifiedTo) {
        const verificationDate = parseVerificationDate(mic);
        if (verificationDate) {
          if (filters.verifiedFrom && verificationDate < filters.verifiedFrom) {
            matchesVerification = false;
          }
          if (filters.verifiedTo && verificationDate > filters.verifiedTo) {
            matchesVerification = false;
          }
        } else {
          matchesVerification = false; // No verification date
        }
      }
      
      return matchesSearch && matchesStatus && matchesBorough && matchesDay && matchesCost && matchesVerification;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a['Open Mic'] || '';
          bValue = b['Open Mic'] || '';
          break;
        case 'venue':
          aValue = a['Venue Name'] || '';
          bValue = b['Venue Name'] || '';
          break;
        case 'day':
          aValue = a['Day'] || '';
          bValue = b['Day'] || '';
          break;
        case 'time':
          aValue = a['Start Time'] || '';
          bValue = b['Start Time'] || '';
          break;
        case 'verified':
          aValue = parseVerificationDate(a);
          bValue = parseVerificationDate(b);
          break;
        default:
          aValue = a['Open Mic'] || '';
          bValue = b['Open Mic'] || '';
      }
      
      // Handle null values for dates
      if (sortBy === 'verified') {
        if (!aValue && !bValue) return 0;
        if (!aValue) return sortOrder === 'asc' ? 1 : -1;
        if (!bValue) return sortOrder === 'asc' ? -1 : 1;
      }
      
      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [mics, search, activeTab, filters, sortBy, sortOrder]);
}; 