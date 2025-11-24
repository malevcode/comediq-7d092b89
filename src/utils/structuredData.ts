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
  
  // Parse times and create ISO strings
  const startDateTime = new Date(nextOccurrence);
  const [startHour, startMinute] = mic.startTime.split(':').map(Number);
  startDateTime.setHours(startHour, startMinute, 0);
  
  const endDateTime = new Date(nextOccurrence);
  const [endHour, endMinute] = mic.latestEndTime.split(':').map(Number);
  endDateTime.setHours(endHour, endMinute, 0);
  
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
