import { useState } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { useMicVerification } from '@/hooks/useMicVerification';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  micUniqueIdentifier: string;
  lastVerified?: string;
  className?: string;
  size?: 'sm' | 'md';
}

// Parse date string like "12/25/2025" or "1/22/2026" to Date
const parseVerificationDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  
  // Handle MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  
  return null;
};

// Check if verified within last 30 days
const isRecentlyVerified = (dateStr?: string): boolean => {
  const date = parseVerificationDate(dateStr);
  if (!date) return false;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return date >= thirtyDaysAgo;
};

// Format date for display
const formatVerificationDate = (dateStr?: string): string => {
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
  const { verify, isVerifying, hasVerifiedToday, justVerified } = useMicVerification(micUniqueIdentifier);
  const [isHovered, setIsHovered] = useState(false);
  
  const isVerified = isRecentlyVerified(lastVerified);
  const displayDate = formatVerificationDate(lastVerified);
  
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

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isVerifying}
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all duration-200',
        'border-2 cursor-pointer select-none',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        sizeClasses,
        // Verified state
        isVerified ? [
          'bg-green-50 dark:bg-green-950/30',
          'border-green-500 dark:border-green-400',
          'text-green-700 dark:text-green-300',
          'hover:bg-green-100 dark:hover:bg-green-900/40',
          'focus:ring-green-500',
        ] : [
          'bg-red-50 dark:bg-red-950/30',
          'border-red-400 dark:border-red-500',
          'text-red-600 dark:text-red-400',
          'hover:bg-red-100 dark:hover:bg-red-900/40',
          'focus:ring-red-500',
        ],
        // Just verified animation
        justVerified && 'animate-pulse ring-2 ring-green-400 ring-offset-2',
        className
      )}
      title={isHovered ? (isVerified ? 'Click to re-verify this mic' : 'Click to verify this mic happened') : undefined}
    >
      {isVerifying ? (
        <Loader2 className={cn('animate-spin', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      ) : justVerified ? (
        <Check className={cn('text-green-600', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      ) : isVerified ? (
        <Check className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      ) : (
        <AlertCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      )}
      
      <span>
        {justVerified ? (
          'Verified! ✨'
        ) : isVerified ? (
          <>Verified: {displayDate}</>
        ) : (
          isHovered ? 'Click to verify' : 'Unverified'
        )}
      </span>
    </button>
  );
};
