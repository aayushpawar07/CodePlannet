import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Select = forwardRef(({ className, label, error, children, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full px-3 py-2 border border-border rounded-lg text-sm transition-colors bg-white',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
          error && 'border-danger focus:ring-danger/50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
