import { OpenMic } from "@/types/openMic";
import { slugify, generateVenueSlug } from "./slugify";

interface FilterParams {
  price?: string;
  time?: string;
  beginner?: boolean;
  borough?: string;
  day?: string;
}

/**
 * Centralized link management for internal navigation
 * Ensures consistent URL structure across the application
 */
export const linkManager = {
  // Mic pages
  micDetail: (mic: OpenMic) => `/mics/${generateVenueSlug(mic)}`,
  
  // User navigation with filters (query params)
  openMicsFilteredByDay: (day: string) => `/open-mics?day=${encodeURIComponent(day)}`,
  openMicsFilteredByBorough: (borough: string) => `/open-mics?borough=${encodeURIComponent(borough)}`,
  
  // SEO pages (for search engines)
  boroughSEO: (borough: string) => `/boroughs/${slugify(borough)}`,
  neighborhoodSEO: (neighborhood: string) => `/neighborhoods/${slugify(neighborhood)}`,
  micsByDaySEO: (day: string) => `/days/${slugify(day)}`,
  
  // Legacy aliases (keep for backward compatibility)
  borough: (borough: string) => `/boroughs/${slugify(borough)}`,
  neighborhood: (neighborhood: string) => `/neighborhoods/${slugify(neighborhood)}`,
  micsByDay: (day: string) => `/days/${slugify(day)}`,
  
  // Filter pages
  freeMics: () => '/free-mics',
  beginnerMics: () => '/beginner-friendly',
  
  // Query-based filters
  openMicsWithFilters: (filters: FilterParams) => {
    const params = new URLSearchParams();
    if (filters.price) params.set('price', filters.price);
    if (filters.time) params.set('time', filters.time);
    if (filters.beginner) params.set('beginner', 'true');
    if (filters.borough) params.set('borough', filters.borough);
    if (filters.day) params.set('day', filters.day);
    return `/open-mics?${params.toString()}`;
  }
};
