import { CheckCircle2, Clock } from 'lucide-react';
import { MicStatus, MicFrequency, FREQUENCY_LABELS } from '@/types/openMic';

interface MicStatusBadgeProps {
  status: MicStatus;
  legacyTag?: string;
  frequency?: MicFrequency;
  showFrequency?: boolean;
  size?: 'sm' | 'md';
}

export function MicStatusBadge({ status, legacyTag, frequency, showFrequency = false, size = 'sm' }: MicStatusBadgeProps) {
  const isSmall = size === 'sm';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Status indicator */}
      {status === 'trial' && (
        <span className={`inline-flex items-center gap-0.5 rounded-full bg-amber-100/60 text-amber-700 border border-amber-200/50 font-medium ${isSmall ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}>
          <Clock className={isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          Trial
        </span>
      )}
      {status === 'verified' && legacyTag && (
        <span className={`inline-flex items-center gap-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/50 font-medium ${isSmall ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}>
          Legacy
        </span>
      )}
      {status === 'verified' && !legacyTag && (
        <CheckCircle2 className={`text-emerald-500 ${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      )}

      {/* Frequency pill */}
      {showFrequency && frequency && frequency !== 'weekly' && (
        <span className={`inline-flex items-center rounded-full bg-muted/50 text-muted-foreground border border-border/50 font-medium whitespace-nowrap ${isSmall ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}>
          {FREQUENCY_LABELS[frequency]}
        </span>
      )}
    </div>
  );
}
