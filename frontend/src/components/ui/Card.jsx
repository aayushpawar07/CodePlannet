import { cn } from '../../utils/cn';

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-surface rounded-xl border border-border shadow-sm p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-lg font-semibold text-text', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }) {
  return (
    <p className={cn('text-sm text-text-light mt-1', className)}>
      {children}
    </p>
  );
}
