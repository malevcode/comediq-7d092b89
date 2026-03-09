import { useUserPlans, useVerifyPlan, useRemovePlan } from '@/hooks/useUserPlans';
import { useOpenMics } from '@/hooks/useOpenMics';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

const VerifyMyDay = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: plans = [], isLoading } = useUserPlans(today);
  const { data: openMics = [] } = useOpenMics();
  const verifyPlan = useVerifyPlan();
  const removePlan = useRemovePlan();

  if (isLoading) return null;
  if (plans.length === 0) return null;

  return (
    <Card className="border-[hsl(213,73%,40%)] bg-[hsl(40,33%,94%)]">
      <CardContent className="p-4">
        <h3 className="font-bold text-[hsl(213,73%,40%)] mb-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Verify My Day
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          One-tap verify mics you planned to hit today (+2 pts each)
        </p>
        <div className="space-y-0">
          {plans.map((plan) => {
            const mic = openMics.find(m => m.uniqueIdentifier === plan.mic_unique_identifier);
            const isVerified = plan.status === 'verified';

            return (
              <div
                key={plan.id}
                className={`flex items-center border-b border-border/50 py-2 ${isVerified ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {mic?.venueName || mic?.openMic || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{mic?.startTime || '—'}</span>
                    <MapPin className="h-3 w-3" />
                    <span>{mic?.neighborhood || mic?.borough || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isVerified ? (
                    <span className="text-xs text-green-600 font-medium px-2">✅ Done</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => verifyPlan.mutate(plan.id)}
                      disabled={verifyPlan.isPending}
                      className="bg-[hsl(213,73%,40%)] text-[hsl(40,33%,94%)] text-xs px-3 h-7"
                    >
                      Verify +2
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePlan.mutate(plan.id)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default VerifyMyDay;
