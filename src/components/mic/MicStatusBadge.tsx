import { CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { MicStatus, MicFrequency, FREQUENCY_LABELS } from '@/types/openMic';

interface MicStatusBadgeProps {
  status: MicStatus;
  legacyTag?: string;
  frequency?: MicFrequency;
  showFrequency?: boolean;
  size?: 'sm' | 'md';
  submissionDate?: string;
}

export function MicStatusBadge({ status, legacyTag, frequency, showFrequency = false, size = 'sm', submissionDate }: MicStatusBadgeProps) {
  const isSmall = size === 'sm';

  // Check if this is a NEW MIC (trial + submitted within 7 days)
  const isNewMic = status === 'trial' && submissionDate && 
    (Date.now() - new Date(submissionDate).getTime()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Status indicator */}
      {status === 'trial' && isNewMic && (
        <span className={`inline-flex items-center gap-0.5 rounded-full bg-emerald-100/80 text-emerald-700 border border-emerald-200/50 font-semibold ${isSmall ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}>
          <Sparkles className={isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          NEW MIC
        </span>
      )}
      {status === 'trial' && !isNewMic && (
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
