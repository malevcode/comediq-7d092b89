import { useState, useRef, useCallback } from 'react';
import { OpenMic } from '@/types/openMic';
import { formatTimeShort, parseTimeToMinutes } from './MapUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { usePlanToHit } from '@/hooks/useUserPlans';
import { CheckCircle, GripHorizontal, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface MapLibreDrawerProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
  selectedDate: Date;
}

// Simple IP hash for verification dedup
const hashIP = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=text');
    const ip = await res.text();
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'unknown';
  }
};

const MapLibreDrawer = ({ mics, onMicSelect, selectedDate }: MapLibreDrawerProps) => {
  const { user } = useAuth();
  const [drawerHeight, setDrawerHeight] = useState(25); // vh
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const planToHit = usePlanToHit();

  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startY: clientY, startHeight: drawerHeight };
  }, [drawerHeight]);

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!dragRef.current) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaVh = ((dragRef.current.startY - clientY) / window.innerHeight) * 100;
    const newHeight = Math.min(80, Math.max(10, dragRef.current.startHeight + deltaVh));
    setDrawerHeight(newHeight);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleVerify = async (mic: OpenMic) => {
    setVerifyingId(mic.uniqueIdentifier);
    try {
      const ipHash = await hashIP();
      const { data, error } = await supabase.rpc('verify_mic_with_points', {
        mic_identifier: mic.uniqueIdentifier,
        user_id_param: user?.id || null,
        ip_hash_param: ipHash,
        status_param: 'verified',
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }

      const result = data as any;
      if (result?.alreadyVerified) {
        toast({ title: 'Already verified today!', description: 'Come back tomorrow.' });
      } else if (result?.pointsAwarded > 0) {
        toast({
          title: '+2 Points! ✅',
          description: `Verified ${mic.openMic}`,
          className: 'bg-[hsl(40,33%,94%)] text-[hsl(213,73%,40%)] border-[hsl(213,73%,40%)]',
        });
      } else {
        toast({ title: 'Verified!', description: 'Log in to earn points.' });
      }
    } catch {
      toast({ title: 'Error', description: 'Verification failed.', variant: 'destructive' });
    } finally {
      setVerifyingId(null);
    }
  };

  const handlePlanToHit = (mic: OpenMic) => {
    if (!user) {
      toast({ title: 'Log in to plan mics', description: 'Create an account to track your day.' });
      return;
    }
    planToHit.mutate({
      micId: mic.uniqueIdentifier,
      plannedDate: format(selectedDate, 'yyyy-MM-dd'),
    });
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-[hsl(40,33%,94%)] border-t-2 border-[hsl(213,73%,40%)] rounded-t-2xl shadow-2xl z-10 flex flex-col"
      style={{ height: `${drawerHeight}vh`, marginBottom: '72px' }}
    >
      {/* Drag handle */}
      <div
        className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing touch-none select-none"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <GripHorizontal className="h-5 w-5 text-[hsl(213,73%,40%)]/60" />
      </div>

      {/* Header */}
      <div className="px-3 pb-1 flex items-center text-xs font-semibold text-[hsl(213,73%,40%)] border-b border-[hsl(213,73%,40%)]/20">
        <span>{mics.length} mics</span>
      </div>

      {/* List - single-line density */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {[...mics].sort((a, b) => (parseTimeToMinutes(a.startTime) ?? 0) - (parseTimeToMinutes(b.startTime) ?? 0)).map((mic) => {
          const isSlotsEnabled = mic.slotsEnabled;

          return (
            <div
              key={mic.uniqueIdentifier}
              className="flex items-center border-b border-[hsl(213,73%,40%)]/10 hover:bg-[hsl(213,73%,40%)]/5 transition-colors cursor-pointer"
              onClick={() => onMicSelect(mic)}
            >
              {/* Time */}
              <div className="w-14 flex-shrink-0 text-center py-1.5 px-1">
                <span className="text-xs font-bold text-[hsl(213,73%,40%)]">
                  {formatTimeShort(mic.startTime)}
                </span>
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-[hsl(213,73%,40%)]/20 flex-shrink-0" />

              {/* Mic Name */}
              <div className="flex-1 truncate py-1.5 px-2">
                <span className="text-xs font-medium text-[hsl(213,73%,40%)]">{mic.openMic}</span>
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-[hsl(213,73%,40%)]/20 flex-shrink-0" />

              {/* Neighborhood */}
              <div className="w-16 flex-shrink-0 text-center py-1.5 px-1">
                <span className="text-[10px] text-[hsl(213,73%,40%)]/70 truncate block">
                  {mic.neighborhood || mic.borough}
                </span>
              </div>

              {/* Action Button: Plan to Hit or Verify */}
              {isSlotsEnabled ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVerify(mic);
                  }}
                  disabled={verifyingId === mic.uniqueIdentifier}
                  className="flex-shrink-0 px-2 py-1.5 hover:bg-[hsl(213,73%,40%)]/10 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className={`h-4 w-4 ${verifyingId === mic.uniqueIdentifier ? 'animate-spin text-muted-foreground' : 'text-[hsl(213,73%,40%)]'}`} />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlanToHit(mic);
                  }}
                  disabled={planToHit.isPending}
                  className="flex-shrink-0 px-2 py-1.5 hover:bg-[hsl(213,73%,40%)]/10 transition-colors disabled:opacity-50"
                  title="Plan to Hit"
                >
                  <MapPin className={`h-4 w-4 text-[hsl(213,73%,40%)]`} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapLibreDrawer;
