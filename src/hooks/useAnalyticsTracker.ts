import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_KEY = 'comediq_session_id';

function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function useAnalyticsTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const lastTrackedPath = useRef<string | null>(null);

  // Track page view on route change
  useEffect(() => {
    const path = location.pathname;
    if (path === lastTrackedPath.current) return;
    lastTrackedPath.current = path;

    const pageName = getPageName(path);
    supabase.from('analytics_events').insert({
      session_id: getSessionId(),
      user_id: user?.id || null,
      event_type: 'page_view',
      event_name: pageName,
      page_path: path,
    }).then(({ error }) => {
      if (error) console.error('Analytics page_view error:', error);
    });
  }, [location.pathname, user?.id]);

  const trackEvent = useCallback((eventType: string, eventName: string, metadata?: Record<string, any>) => {
    supabase.from('analytics_events').insert({
      session_id: getSessionId(),
      user_id: user?.id || null,
      event_type: eventType,
      event_name: eventName,
      page_path: location.pathname,
      metadata: metadata || {},
    }).then(({ error }) => {
      if (error) console.error('Analytics event error:', error);
    });
  }, [user?.id, location.pathname]);

  const trackClick = useCallback((buttonName: string, metadata?: Record<string, any>) => {
    trackEvent('click', buttonName, metadata);
  }, [trackEvent]);

  const trackFeature = useCallback((featureName: string, metadata?: Record<string, any>) => {
    trackEvent('feature_use', featureName, metadata);
  }, [trackEvent]);

  return { trackClick, trackFeature, trackEvent };
}

function getPageName(path: string): string {
  if (path === '/') return 'home';
  const segments = path.split('/').filter(Boolean);
  return segments.join('_') || 'home';
}

// Singleton tracker for use outside React components
export function trackAnalyticsEvent(eventType: string, eventName: string, pagePath: string, userId?: string, metadata?: Record<string, any>) {
  supabase.from('analytics_events').insert({
    session_id: getSessionId(),
    user_id: userId || null,
    event_type: eventType,
    event_name: eventName,
    page_path: pagePath,
    metadata: metadata || {},
  }).then(({ error }) => {
    if (error) console.error('Analytics event error:', error);
  });
}
