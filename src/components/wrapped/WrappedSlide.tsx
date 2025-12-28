import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WrappedSlideProps {
  children: ReactNode;
  gradient?: string;
  isActive?: boolean;
  className?: string;
}

const WrappedSlide = ({ 
  children, 
  gradient = 'from-orange-500 via-pink-500 to-cyan-500',
  isActive = true,
  className 
}: WrappedSlideProps) => {
  if (!isActive) return null;

  return (
    <div 
      className={cn(
        'min-h-[80vh] flex flex-col items-center justify-center p-8 rounded-3xl',
        `bg-gradient-to-br ${gradient}`,
        'animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  );
};

export default WrappedSlide;
