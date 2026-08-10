import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Sparkles, X } from 'lucide-react';
import { invokeSupabaseFunction } from '@/utils/supabaseFunctions';

const SUCCESS_PARAMS = [
  ['subscription', 'success'],
  ['checkout', 'success'],
  ['payment', 'success'],
  ['subscribed', 'true'],
];

const SYNC_PARAMS = [
  ...SUCCESS_PARAMS,
  ['billing', 'portal'],
];

export default function SubscriptionSuccessBanner() {
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldSync, setShouldSync] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hasSuccessParam = SUCCESS_PARAMS.some(
      ([key, value]) => searchParams.get(key)?.toLowerCase() === value,
    );
    const hasSyncParam = SYNC_PARAMS.some(
      ([key, value]) => searchParams.get(key)?.toLowerCase() === value,
    );

    if (hasSuccessParam) {
      setIsVisible(true);
    }

    if (hasSyncParam) {
      setShouldSync(true);
      setHasSynced(false);
    }
  }, [location.search]);

  useEffect(() => {
    if (!shouldSync || !user || hasSynced) return;

    setHasSynced(true);
    invokeSupabaseFunction('sync-subscription-status')
      .finally(() => {
        refreshProfile();
        window.setTimeout(refreshProfile, 2000);
      });
  }, [hasSynced, refreshProfile, shouldSync, user]);

  useEffect(() => {
    if (!isVisible) return;

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, 12000);

    return () => window.clearTimeout(timeoutId);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed left-4 right-4 top-4 z-[200] mx-auto max-w-4xl">
      <Card className="relative overflow-hidden border border-yellow-300/60 border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 via-amber-50 to-white shadow-lg">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 pr-9">
            <div className="mt-0.5 rounded-full bg-yellow-100 p-2 text-yellow-700">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <Badge
                variant="outline"
                className="mb-2 text-[10px] font-semibold text-yellow-800 border-yellow-500/60 bg-yellow-100/60 gap-1 px-2 py-0.5"
              >
                <Sparkles className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                FULL PASS ACTIVATED
              </Badge>
              <h2 className="text-base font-bold leading-tight text-foreground sm:text-lg">
                Congratulations on taking a huge step.
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                You are tracking your comedy and committing to doing comedy every month.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            className="absolute right-2 top-2 h-8 w-8 text-yellow-900/70 hover:bg-yellow-100 hover:text-yellow-950"
            aria-label="Dismiss subscription congratulations"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
