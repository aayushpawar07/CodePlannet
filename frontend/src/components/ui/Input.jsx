import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(({ className, label, error, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 border border-border rounded-lg text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
          'placeholder:text-text-light/60',
          error && 'border-danger focus:ring-danger/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
