import { cn } from '../../utils/cn';

export default function Spinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-primary/20 border-t-primary',
          sizes[size]
        )}
      />
    </div>
  );
}
