import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function LoadingState({ 
  className, 
  size = 'md', 
  text,
  fullScreen = false 
}: LoadingStateProps) {
  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3',
      fullScreen && 'min-h-screen',
      className
    )}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse-soft">
          {text}
        </p>
      )}
    </div>
  );

  return content;
}

export function LoadingSpinner({ className, size = 'md' }: Omit<LoadingStateProps, 'text' | 'fullScreen'>) {
  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
}
