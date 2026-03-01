import { useAnalyticsTracker } from '@/hooks/useAnalyticsTracker';
import { createContext, useContext } from 'react';

interface AnalyticsContextType {
  trackClick: (buttonName: string, metadata?: Record<string, any>) => void;
  trackFeature: (featureName: string, metadata?: Record<string, any>) => void;
  trackEvent: (eventType: string, eventName: string, metadata?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  trackClick: () => {},
  trackFeature: () => {},
  trackEvent: () => {},
});

export function useAnalytics() {
  return useContext(AnalyticsContext);
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const tracker = useAnalyticsTracker();

  return (
    <AnalyticsContext.Provider value={tracker}>
      {children}
    </AnalyticsContext.Provider>
  );
}
