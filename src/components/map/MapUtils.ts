// Calculate distance between two coordinates in miles
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Format distance for display
export const formatDistance = (distanceMiles: number): string => {
  if (distanceMiles < 0.1) {
    const feet = Math.round(distanceMiles * 5280);
    return `${feet}ft`;
  } else if (distanceMiles < 1) {
    return `${(distanceMiles * 5280).toFixed(0)}ft`;
  } else if (distanceMiles < 10) {
    return `${distanceMiles.toFixed(1)}mi`;
  } else {
    return `${Math.round(distanceMiles)}mi`;
  }
};

// Format distance for display (always in miles for consistency)
export const formatDistanceMiles = (distanceMiles: number): string => {
  if (distanceMiles < 0.1) {
    return `${distanceMiles.toFixed(2)}mi`;
  } else if (distanceMiles < 1) {
    return `${distanceMiles.toFixed(2)}mi`;
  } else if (distanceMiles < 10) {
    return `${distanceMiles.toFixed(1)}mi`;
  } else {
    return `${Math.round(distanceMiles)}mi`;
  }
};

// Borough color mapping matching the existing system
export const getBoroughColor = (borough: string): string => {
  const cleanBorough = borough.trim();
  const colors = {
    Manhattan: "#06b6d4", // cyan-500
    Brooklyn: "#92400e", // amber-800  
    Queens: "#7c3aed", // purple-600
    Bronx: "#ea580c", // orange-600
    "Staten Island": "#6b7280" // gray-500
  };
  return colors[cleanBorough as keyof typeof colors] || "#6b7280";
};

// Get verification status color
export const getVerificationColor = (lastVerified: string): string => {
  const verification = lastVerified?.toLowerCase() || '';
  
  // if (verification.includes('tediously verified') || verification.includes('tedious')) {
  //   return "#fef3c7"; // yellow-100
  // } else if (verification.includes('verified') || verification.includes('confirm')) {
  //   return "#d1fae5"; // emerald-100
  // } else {
  //   return "#fee2e2"; // red-100
  // }

  if (verification.includes('unverified')) {
    return "#fee2e2"; // red-100
  } else {
    return "#d1fae5"; // emerald-100
  }
};

// Format time for display
export const formatTime = (timeStr: string): string => {
  return timeStr;
};

// Format time to short label — PM assumed (comedy is nighttime), only show "a" for AM
export const formatTimeShort = (timeStr: string): string => {
  if (!timeStr) return '?';
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return timeStr.length > 5 ? timeStr.substring(0, 5) : timeStr;
  const hour = parseInt(match[1]);
  const min = parseInt(match[2]);
  const isAM = match[3].toUpperCase() === 'AM';
  const suffix = isAM ? 'a' : '';
  if (min === 0) return `${hour}${suffix}`;
  return `${hour}:${match[2]}${suffix}`;
};

// Parse 12h time string into minutes since midnight
export const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  else if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// Determine if a mic is currently LIVE based on day + time
export const getMicLiveStatus = (
  micDay: string,
  startTime: string,
  endTime: string
): 'live' | 'soon' | 'today' | 'other' => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  if (micDay !== currentDay) return 'other';

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMin = parseTimeToMinutes(startTime);
  if (startMin === null) return 'today';

  // Default end time: 2 hours after start if not specified
  let endMin = parseTimeToMinutes(endTime);
  if (endMin === null) endMin = startMin + 120;
  // Handle overnight mics (end < start)
  if (endMin < startMin) endMin += 24 * 60;

  if (currentMinutes >= startMin && currentMinutes <= endMin) return 'live';
  if (startMin - currentMinutes > 0 && startMin - currentMinutes <= 30) return 'soon';
  if (startMin > currentMinutes) return 'today';
  return 'other'; // already ended
};

// Format cost for display
export const formatCost = (cost: string): string => {
  if (cost.toLowerCase().includes('free')) return 'Free';
  const match = cost.match(/\$?(\d+)/);
  if (match) return `$${match[1]}`;
  return cost.length > 8 ? cost.substring(0, 8) + '...' : cost;
};

// Format stage time for display
export const formatStageTime = (stageTime: string): string => {
  const match = stageTime.match(/(\d+)/);
  if (match) return match[1];
  return stageTime.replace(/\s*(minutes?|mins?)\s*/gi, '').trim().substring(0, 3);
};

// Get borough initial
export const getBoroughInitial = (borough: string): string => {
  const cleanBorough = borough.trim();
  const initials = {
    Manhattan: "M",
    Brooklyn: "B", 
    Queens: "Q",
    Bronx: "X",
    "Staten Island": "S"
  };
  return initials[cleanBorough as keyof typeof initials] || "?";
};

// Get marker color based on verification status
export const getMarkerColor = (verified: string, tediouslyVerified: string): string => {
  if (tediouslyVerified === 'true') return '#fef3c7'; // yellow-100
  if (verified === 'true') return '#d1fae5'; // emerald-100
  return '#fee2e2'; // red-100
}; 