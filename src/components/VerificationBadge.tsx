import { useState } from 'react';
import { CheckCircle2, HelpCircle, Loader2 } from 'lucide-react';
import { useMicVerification } from '@/hooks/useMicVerification';
import { useLatestVerification } from '@/hooks/useLatestVerification';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  micUniqueIdentifier: string;
  lastVerified?: string;
  className?: string;
  size?: 'sm' | 'md';
}

// Parse date string - handles both ISO format and MM/DD/YYYY
const parseVerificationDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  
  // Try ISO format first (from mic_verifications)
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime()) && dateStr.includes('-')) {
    return isoDate;
  }
  
  // Fall back to MM/DD/YYYY format (from open_mics_historical)
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  
  return null;
};

// Check if verified within last 30 days
const isRecentlyVerified = (dateStr?: string | null): boolean => {
  const date = parseVerificationDate(dateStr);
  if (!date) return false;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return date >= thirtyDaysAgo;
};

// Format date for display
const formatVerificationDate = (dateStr?: string | null): string => {
  const date = parseVerificationDate(dateStr);
  if (!date) return '';
  
  return `${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}`;
};

export const VerificationBadge = ({ 
  micUniqueIdentifier, 
  lastVerified,
  className,
  size = 'md'
}: VerificationBadgeProps) => {
  const { verify, isVerifying, justVerified } = useMicVerification(micUniqueIdentifier);
  const { latestVerification } = useLatestVerification(micUniqueIdentifier);
  const [isHovered, setIsHovered] = useState(false);
  
  // Use fetched latest verification, fall back to prop
  const effectiveDate = latestVerification || lastVerified;
  const isVerified = isRecentlyVerified(effectiveDate);
  const displayDate = formatVerificationDate(effectiveDate);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isVerifying) {
      verify();
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : 'text-sm px-3 py-1 gap-1.5';

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  // Determine text to display
  const getText = () => {
    if (justVerified) return 'Thanks! +2 pts';
    if (isVerified) return `Verified ${displayDate}`;
    if (isHovered) return 'I was there (+2 pts)';
    return 'Needs verification';
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isVerifying}
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'border cursor-pointer select-none',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        sizeClasses,
        // State-based styling
        justVerified ? [
          'bg-emerald-100 dark:bg-emerald-900/40',
          'border-emerald-500 dark:border-emerald-400',
          'text-emerald-800 dark:text-emerald-200',
          'focus:ring-emerald-500',
        ] : isVerified ? [
          'bg-emerald-50 dark:bg-emerald-950/30',
          'border-emerald-400 dark:border-emerald-500',
          'text-emerald-700 dark:text-emerald-300',
          'hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
          'focus:ring-emerald-500',
        ] : isHovered ? [
          'bg-amber-50 dark:bg-amber-950/30',
          'border-amber-300 dark:border-amber-500',
          'text-amber-700 dark:text-amber-300',
          'focus:ring-amber-500',
        ] : [
          'bg-gray-50 dark:bg-gray-800/50',
          'border-gray-300 dark:border-gray-600',
          'text-gray-600 dark:text-gray-400',
          'hover:bg-gray-100 dark:hover:bg-gray-700/50',
          'focus:ring-gray-400',
        ],
        className
      )}
      title={isVerified ? 'Click to re-verify this mic' : 'Click to verify this mic happened'}
    >
      {isVerifying ? (
        <Loader2 className={cn('animate-spin', iconSize)} />
      ) : isVerified || justVerified ? (
        <CheckCircle2 className={iconSize} />
      ) : (
        <HelpCircle className={iconSize} />
      )}
      
      <span>{getText()}</span>
    </button>
  );
};
