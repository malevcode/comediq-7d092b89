import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

const AnimatedCounter = ({ 
  value, 
  duration = 2000, 
  suffix = '', 
  prefix = '',
  className = ''
}: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (value === 0) {
      setCount(0);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function for smooth deceleration with a bit of overshoot
      const easeOutBack = (x: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
      };
      
      const eased = easeOutBack(progress);
      const currentValue = Math.min(Math.floor(startValue + (value - startValue) * eased), value);
      
      setCount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span 
      className={`${className} ${hasAnimated ? 'animate-pulse-glow' : ''}`}
      style={{ 
        textShadow: hasAnimated ? '0 0 40px hsl(var(--comediq-cream) / 0.3)' : 'none',
        transition: 'text-shadow 0.5s ease-out'
      }}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export default AnimatedCounter;
