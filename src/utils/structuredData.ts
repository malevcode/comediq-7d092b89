interface OrganizationSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

interface EventSchema {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  eventStatus: string;
  eventAttendanceMode: string;
  location: {
    '@type': string;
    name: string;
    address: string;
  };
  organizer?: {
    '@type': string;
    name: string;
  };
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

interface LocalBusinessSchema {
  '@context': string;
  '@type': string;
  name: string;
  address: {
    '@type': string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  aggregateRating?: {
    '@type': string;
    ratingValue: number;
    reviewCount: number;
  };
}

interface BreadcrumbSchema {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

export const generateOrganizationSchema = (): OrganizationSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Comediq',
  url: 'https://comediq.us',
  logo: 'https://comediq.us/comediq_logo.jpg',
  description: "NYC's comprehensive comedy open mic directory and comedian toolkit",
  sameAs: [
    'https://instagram.com/comediq',
    'https://twitter.com/comediq',
  ],
});

export const generateEventSchema = (mic: {
  openMic: string;
  venueName: string;
  day: string;
  startTime: string;
  latestEndTime: string;
  location: string;
  cost: string;
  hosts?: string;
}): EventSchema => {
  // Calculate next occurrence of this day
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDay = daysOfWeek.indexOf(mic.day);
  const today = new Date();
  const currentDay = today.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
  const nextOccurrence = new Date(today);
  nextOccurrence.setDate(today.getDate() + daysUntilTarget);
  
  // Helper function to parse time strings with AM/PM
  const parseTime = (timeString: string): { hour: number; minute: number } => {
    // Default to 7:00 PM if time is invalid or missing
    if (!timeString || timeString.toLowerCase() === 'tbd') {
      return { hour: 19, minute: 0 };
    }
    
    // Remove any whitespace and convert to lowercase for easier parsing
    const cleanTime = timeString.trim().toLowerCase();
    
    // Extract hour, minute, and AM/PM
    const timeMatch = cleanTime.match(/(\d+):?(\d{2})?\s*(am|pm)?/);
    if (!timeMatch) {
      return { hour: 19, minute: 0 }; // Default fallback
    }
    
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3];
    
    // Convert to 24-hour format
    if (period === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period === 'am' && hour === 12) {
      hour = 0;
    }
    
    // Validate parsed values
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return { hour: 19, minute: 0 }; // Default fallback
    }
    
    return { hour, minute };
  };
  
  // Parse times and create ISO strings
  const startDateTime = new Date(nextOccurrence);
  const startParsed = parseTime(mic.startTime);
  startDateTime.setHours(startParsed.hour, startParsed.minute, 0);
  
  const endDateTime = new Date(nextOccurrence);
  const endParsed = parseTime(mic.latestEndTime);
  endDateTime.setHours(endParsed.hour, endParsed.minute, 0);
  
  // If end time is before start time, assume it's the next day
  if (endDateTime <= startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }
  
  const schema: EventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: mic.openMic,
    description: `Comedy open mic at ${mic.venueName}. ${mic.cost === 'Free' ? 'Free admission' : `$${mic.cost}`}.`,
    startDate: startDateTime.toISOString(),
    endDate: endDateTime.toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: mic.venueName,
      address: mic.location,
    },
  };
  
  if (mic.hosts) {
    schema.organizer = {
      '@type': 'Person',
      name: mic.hosts,
    };
  }
  
  if (mic.cost) {
    const priceValue = mic.cost.toLowerCase() === 'free' ? '0' : mic.cost.replace(/[^0-9.]/g, '');
    schema.offers = {
      '@type': 'Offer',
      price: priceValue,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    };
  }
  
  return schema;
};

export const generateLocalBusinessSchema = (venue: {
  name: string;
  location: string;
  borough: string;
  rating?: number;
  reviewCount?: number;
}): LocalBusinessSchema => {
  const schema: LocalBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ComedyClub',
    name: venue.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.location.split(',')[0] || venue.location,
      addressLocality: venue.borough || 'New York',
      addressRegion: 'NY',
      addressCountry: 'US',
    },
  };
  
  if (venue.rating && venue.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: venue.rating,
      reviewCount: venue.reviewCount,
    };
  }
  
  return schema;
};

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>): BreadcrumbSchema => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const generateWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Comediq',
  url: 'https://comediq.us',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://comediq.us/open-mics?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
});

/**
 * Generate AggregateRating schema for reviews
 */
export const generateAggregateRatingSchema = (rating: number, reviewCount: number) => ({
  '@context': 'https://schema.org',
  '@type': 'AggregateRating',
  ratingValue: rating.toFixed(1),
  reviewCount: reviewCount,
  bestRating: '5',
  worstRating: '1',
});
