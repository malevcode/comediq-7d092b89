import { pb } from '@/integrations/pocketbase/client';

export async function trackAnalyticsEvent(
  eventType: string,
  eventName: string,
  pagePath: string,
  sessionId: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  try {
    await pb.collection('analytics_events').create({
      session_id: sessionId,
      user_id: userId || null,
      event_type: eventType,
      event_name: eventName,
      page_path: pagePath,
      metadata: metadata || {},
    });
  } catch {
    // Analytics should never break the app
  }
}
