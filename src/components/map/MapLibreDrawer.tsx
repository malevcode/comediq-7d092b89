import { useState, useRef, useCallback } from 'react';
import { OpenMic } from '@/types/openMic';
import { formatTimeShort } from './MapUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, GripHorizontal } from 'lucide-react';

interface MapLibreDrawerProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
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

const MapLibreDrawer = ({ mics, onMicSelect }: MapLibreDrawerProps) => {
  const { user } = useAuth();
  const [drawerHeight, setDrawerHeight] = useState(40); // vh
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

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

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-2xl shadow-2xl z-10 flex flex-col"
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
        <GripHorizontal className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Header */}
      <div className="px-3 pb-1 flex items-center justify-between text-xs text-muted-foreground border-b border-border">
        <span>{mics.length} mics</span>
        <span>Transit View</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {mics.map((mic) => (
          <div
            key={mic.uniqueIdentifier}
            className="flex items-center border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onMicSelect(mic)}
          >
            {/* Time */}
            <div className="w-16 flex-shrink-0 text-center py-2 px-1">
              <span className="text-xs font-bold text-foreground">
                {formatTimeShort(mic.startTime)}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-border flex-shrink-0" />

            {/* Venue */}
            <div className="flex-1 truncate py-2 px-2">
              <span className="text-xs font-medium text-foreground">{mic.venueName || mic.openMic}</span>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-border flex-shrink-0" />

            {/* Neighborhood */}
            <div className="w-20 flex-shrink-0 text-center py-2 px-1">
              <span className="text-[10px] text-muted-foreground truncate block">
                {mic.neighborhood || mic.borough}
              </span>
            </div>

            {/* Verify Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVerify(mic);
              }}
              disabled={verifyingId === mic.uniqueIdentifier}
              className="flex-shrink-0 px-2 py-2 hover:bg-accent transition-colors disabled:opacity-50"
            >
              <CheckCircle className={`h-4 w-4 ${verifyingId === mic.uniqueIdentifier ? 'animate-spin text-muted-foreground' : 'text-[hsl(var(--comediq-blue))]'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapLibreDrawer;
