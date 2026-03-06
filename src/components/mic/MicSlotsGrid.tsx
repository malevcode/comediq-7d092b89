import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateNextEvent, signUpForEvent, fetchEventSignups } from '@/api/signups';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, AlertTriangle, Zap, PartyPopper, Star } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface MicSlotsGridProps {
  micId: string;
  micDay: string;
  startTime: string;
  slotDurationMinutes: number;
  pricePerSlot?: number;
}

interface SlotSignup {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles?: { username: string | null };
}

function calculateProjectedTime(startTime: string, slotIndex: number, durationMinutes: number): string {
  // Parse start time like "7:00 PM", "7:30PM", "19:00"
  const cleaned = startTime.trim().toUpperCase();
  let hours = 0;
  let minutes = 0;

  const match12 = cleaned.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);

  if (match12) {
    hours = parseInt(match12[1]);
    minutes = parseInt(match12[2] || '0');
    if (match12[3] === 'PM' && hours !== 12) hours += 12;
    if (match12[3] === 'AM' && hours === 12) hours = 0;
  } else if (match24) {
    hours = parseInt(match24[1]);
    minutes = parseInt(match24[2]);
  } else {
    return '';
  }

  const totalMinutes = hours * 60 + minutes + slotIndex * durationMinutes;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function MicSlotsGrid({ micId, micDay, startTime, slotDurationMinutes, pricePerSlot }: MicSlotsGridProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [event, setEvent] = useState<any>(null);
  const [signups, setSignups] = useState<SlotSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const evt = await getOrCreateNextEvent(micId, micDay, startTime);
      setEvent(evt);
      if (evt) {
        const sigs = await fetchEventSignups(evt.id);
        setSignups(sigs.filter((s: SlotSignup) => s.status === 'confirmed'));
      }
    } catch (err) {
      console.error('Failed to load slots data:', err);
    } finally {
      setLoading(false);
    }
  }, [micId, micDay, startTime]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, loadData]);

  const handleBookSlot = async (slotIndex: number) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (pricePerSlot && pricePerSlot > 0) {
      toast({ title: 'Paid Slots Coming Soon', description: `This slot costs $${pricePerSlot}. Stripe integration launching soon!` });
      return;
    }

    try {
      setBookingSlot(slotIndex);
      await signUpForEvent(event.id);
      
      // Show confetti
      setBookedSlot(slotIndex);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      toast({
        title: '🎉 You\'re in!',
        description: `Slot #${slotIndex + 1} booked — stage time at ${calculateProjectedTime(startTime, slotIndex, slotDurationMinutes)}`,
      });

      // Reload data
      await loadData();
      queryClient.invalidateQueries({ queryKey: ['signupEvents'] });
    } catch (err: any) {
      const msg = err?.message || 'Failed to book slot';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        toast({ title: 'Already Signed Up', description: 'You already have a slot for this event.', variant: 'destructive' });
      } else {
        toast({ title: 'Booking Failed', description: msg, variant: 'destructive' });
      }
    } finally {
      setBookingSlot(null);
    }
  };

  const totalSlots = event?.total_spots || 15;
  const userAlreadySignedUp = signups.some(s => s.user_id === user?.id);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading Comediq Slots!...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8C00'][i % 8],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <Card className="border-primary/30 bg-gradient-to-br from-background to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Comediq Slots!</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {signups.length}/{totalSlots} filled
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {slotDurationMinutes} min per slot · One-click signup
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <div className="text-center py-4 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground mb-2">Log in to grab a slot</p>
              <Button onClick={() => navigate('/auth')} size="sm">Log In</Button>
            </div>
          )}

          {user && userAlreadySignedUp && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <PartyPopper className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-primary">You&apos;re signed up for this event!</p>
            </div>
          )}

          {/* Slots Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {Array.from({ length: totalSlots }).map((_, i) => {
              const signup = signups[i];
              const isAvailable = !signup;
              const projectedTime = calculateProjectedTime(startTime, i, slotDurationMinutes);
              const isBooked = bookedSlot === i;

              return (
                <button
                  key={i}
                  onClick={() => isAvailable && !userAlreadySignedUp && handleBookSlot(i)}
                  disabled={!isAvailable || userAlreadySignedUp || bookingSlot !== null || !user}
                  className={`
                    relative p-3 rounded-lg border text-left transition-all duration-200
                    ${isAvailable && user && !userAlreadySignedUp
                      ? 'border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary hover:shadow-md cursor-pointer'
                      : isAvailable
                        ? 'border-border bg-muted/30'
                        : 'border-destructive/30 bg-destructive/5'
                    }
                    ${isBooked ? 'ring-2 ring-primary animate-pulse' : ''}
                    ${bookingSlot === i ? 'opacity-70' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                    {isAvailable ? (
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    {projectedTime}
                  </div>
                  {signup ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-[10px] bg-destructive/20 text-destructive-foreground">
                          {(signup.profiles?.username || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate">
                        {signup.profiles?.username || 'Comedian'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-primary">
                      {bookingSlot === i ? 'Booking...' : 'Available'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* No-show warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p>
                No-shows result in a <span className="font-semibold text-destructive">-5 point</span> deduction.
                Please cancel in advance if you can&apos;t make it.
              </p>
              {user && (
                <Link to="/profile" className="inline-flex items-center gap-1 mt-1 text-primary hover:underline font-medium">
                  <Star className="w-3 h-3" />
                  View My Points
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
