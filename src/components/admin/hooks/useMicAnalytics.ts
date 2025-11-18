import { useMemo } from 'react';

export interface VerificationStats {
  verified: number;
  verifiedTediously: number;
  unverified: number;
  total: number;
  verifiedPercentage: number;
  verifiedTediouslyPercentage: number;
  unverifiedPercentage: number;
}

export interface BoroughStats {
  borough: string;
  count: number;
  percentage: number;
  activeCount: number;
  inactiveCount: number;
}

export interface DayTimeStats {
  day: string;
  timeSlots: {
    morning: number;
    afternoon: number;
    evening: number;
    lateNight: number;
  };
  total: number;
}

// Helper function to parse verification status
export const getVerificationStatus = (lastVerified: string): 'verified' | 'verified_tediously' | 'unverified' => {
  if (!lastVerified || lastVerified.trim() === '') {
    return 'unverified';
  }
  
  const lower = lastVerified.toLowerCase();
  
  if (lower.includes('unverified')) {
    return 'unverified';
  }
  
  // Check for "verified tediously" BEFORE "verified" to avoid false matches
  if (lower.includes('verified tediously')) {
    return 'verified_tediously';
  }
  
  if (lower.includes('verified')) {
    return 'verified';
  }
  
  return 'unverified';
};

// Helper function to categorize time of day
export const getTimeOfDay = (startTime: string): 'morning' | 'afternoon' | 'evening' | 'lateNight' => {
  if (!startTime) return 'evening';
  
  // Extract hour from time string (e.g., "8:00 PM" -> 20)
  const timeMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) return 'evening';
  
  let hour = parseInt(timeMatch[1]);
  const period = timeMatch[3].toUpperCase();
  
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'lateNight';
};

export const useMicAnalytics = (mics: any[]) => {
  return useMemo(() => {
    // Verification Statistics
    const verificationStats = mics.reduce((stats, mic) => {
      const status = getVerificationStatus(mic['last_verified'] || '');
      if (status === 'verified_tediously') {
        stats.verifiedTediously++;
      } else {
        stats[status]++;
      }
      stats.total++;
      return stats;
    }, {
      verified: 0,
      verifiedTediously: 0,
      unverified: 0,
      total: 0
    });

    const verificationStatsWithPercentages: VerificationStats = {
      ...verificationStats,
      verifiedPercentage: verificationStats.total > 0 ? (verificationStats.verified / verificationStats.total) * 100 : 0,
      verifiedTediouslyPercentage: verificationStats.total > 0 ? (verificationStats.verifiedTediously / verificationStats.total) * 100 : 0,
      unverifiedPercentage: verificationStats.total > 0 ? (verificationStats.unverified / verificationStats.total) * 100 : 0,
    };

    // Borough Distribution
    const boroughStats = mics.reduce((acc, mic) => {
      const borough = mic['borough']?.trim() || 'Unknown';
      if (!acc[borough]) {
        acc[borough] = { count: 0, activeCount: 0, inactiveCount: 0 };
      }
      acc[borough].count++;
      if (mic.active === true || mic.active === 1) {
        acc[borough].activeCount++;
      } else {
        acc[borough].inactiveCount++;
      }
      return acc;
    }, {} as Record<string, { count: number; activeCount: number; inactiveCount: number }>);

    const boroughStatsArray: BoroughStats[] = Object.entries(boroughStats)
      .map(([borough, stats]) => ({
        borough,
        count: (stats as { count: number; activeCount: number; inactiveCount: number }).count,
        percentage: ((stats as { count: number; activeCount: number; inactiveCount: number }).count / mics.length) * 100,
        activeCount: (stats as { count: number; activeCount: number; inactiveCount: number }).activeCount,
        inactiveCount: (stats as { count: number; activeCount: number; inactiveCount: number }).inactiveCount,
      }))
      .sort((a, b) => b.count - a.count);

    // Day/Time Heatmap
    const dayTimeStats: Record<string, DayTimeStats> = {
      Monday: { day: 'Monday', timeSlots: { morning: 0, afternoon: 0, evening: 0, lateNight: 0 }, total: 0 },
      Tuesday: { day: 'Tuesday', timeSlots: { morning: 0, afternoon: 0, evening: 0, lateNight: 0 }, total: 0 },
      Wednesday: { day: 'Wednesday', timeSlots: { morning: 0, afternoon: 0, evening: 0, lateNight: 0 }, total: 0 },
      Thursday: { day: 'Thursday', timeSlots: { morning: 0, afternoon: 0, evening: 0, lateNight: 0 }, total: 0 },
      Friday: { day: 'Friday', timeSlots: { morning: 0, afternoon: 0, evening: 0, lateNight: 0 }, total: 0 },
      Saturday: { day: 'Saturday', timeSlots: { morning: 0, afternoon: 0, evening: 0, lateNight: 0 }, total: 0 },
      Sunday: { day: 'Sunday', timeSlots: { morning: 0, afternoon: 0, evening: 0, lateNight: 0 }, total: 0 },
    };

    mics.forEach(mic => {
      const day = mic['Day']?.trim();
      const startTime = mic['Start Time'];
      
      if (day && dayTimeStats[day]) {
        const timeOfDay = getTimeOfDay(startTime);
        dayTimeStats[day].timeSlots[timeOfDay]++;
        dayTimeStats[day].total++;
      }
    });

    const dayTimeStatsArray = Object.values(dayTimeStats);

    // Additional insights
    const totalActiveMics = mics.filter(mic => mic.active === true || mic.active === 1).length;
    const totalInactiveMics = mics.length - totalActiveMics;
    
    const freeMics = mics.filter(mic => {
      const cost = mic['Cost']?.toLowerCase() || '';
      return cost.includes('free') || cost === '0' || cost === '$0';
    }).length;
    
    const paidMics = mics.length - freeMics;

    return {
      verificationStats: verificationStatsWithPercentages,
      boroughStats: boroughStatsArray,
      dayTimeStats: dayTimeStatsArray,
      totalMics: mics.length,
      totalActiveMics,
      totalInactiveMics,
      freeMics,
      paidMics,
      activePercentage: mics.length > 0 ? (totalActiveMics / mics.length) * 100 : 0,
      freePercentage: mics.length > 0 ? (freeMics / mics.length) * 100 : 0,
    };
  }, [mics]);
}; 