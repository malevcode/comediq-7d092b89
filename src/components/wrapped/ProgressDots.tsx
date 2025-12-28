import { cn } from '@/lib/utils';

interface ProgressDotsProps {
  total: number;
  current: number;
  onDotClick?: (index: number) => void;
}

const ProgressDots = ({ total, current, onDotClick }: ProgressDotsProps) => {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick?.(index)}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            index === current 
              ? 'w-8 bg-comediq-cream' 
              : 'w-2 bg-comediq-cream/40 hover:bg-comediq-cream/60',
            onDotClick && 'cursor-pointer'
          )}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default ProgressDots;
