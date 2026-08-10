import { useCallback } from 'react';

// Analytics disabled to eliminate Supabase egress until billing cycle resets
export function useAnalyticsTracker() {
  const trackEvent = useCallback((_eventType: string, _eventName: string, _metadata?: Record<string, unknown>) => {}, []);
  const trackClick = useCallback((_buttonName: string, _metadata?: Record<string, unknown>) => {}, []);
  const trackFeature = useCallback((_featureName: string, _metadata?: Record<string, unknown>) => {}, []);

  return { trackClick, trackFeature, trackEvent };
}

export function trackAnalyticsEvent() {}
