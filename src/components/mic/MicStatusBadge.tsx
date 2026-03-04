import { Badge } from '@/components/ui/badge';
import { MicStatus, MicFrequency, FREQUENCY_LABELS } from '@/types/openMic';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

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
      {/* Status badge */}
      {status === 'trial' && (
        <Badge variant="outline" className={`border-amber-400 bg-amber-50 text-amber-700 ${isSmall ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}>
          <Clock className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-0.5`} />
          Trial
        </Badge>
      )}
      {status === 'verified' && legacyTag && (
        <Badge variant="outline" className={`border-blue-300 bg-blue-50 text-blue-700 ${isSmall ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}>
          <ShieldCheck className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-0.5`} />
          {legacyTag}
        </Badge>
      )}
      {status === 'verified' && !legacyTag && (
        <Badge variant="outline" className={`border-green-400 bg-green-50 text-green-700 ${isSmall ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}>
          <ShieldCheck className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-0.5`} />
          Verified
        </Badge>
      )}
      {status === 'pending' && (
        <Badge variant="outline" className={`border-red-300 bg-red-50 text-red-700 ${isSmall ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}>
          <AlertTriangle className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-0.5`} />
          Pending
        </Badge>
      )}

      {/* Frequency badge */}
      {showFrequency && frequency && frequency !== 'weekly' && (
        <Badge variant="secondary" className={`${isSmall ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}>
          {FREQUENCY_LABELS[frequency]}
        </Badge>
      )}
    </div>
  );
}
