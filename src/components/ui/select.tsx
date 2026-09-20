import { useAppLanguage, tx } from '@/i18n'
import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';

export interface SelectOption { value: string; label: string; disabled?: boolean; }

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, hint, error, options, placeholder, required, className, 'aria-describedby': ariaDescribedBy, ...props },
  ref,
) {
  useAppLanguage();
  const generatedId = useId();
  const selectId = id ?? props.name ?? generatedId;
  const descriptionId = `${selectId}-${error ? 'error' : 'hint'}`;
  const describedBy = [ariaDescribedBy, (error || hint) ? descriptionId : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <div className="w-full">
      {tx(label && <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{tx(label)}{tx(required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>)}</label>)}
      <div className="relative">
        <select ref={ref} id={selectId} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} className={cn('min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800', Boolean(error) && 'border-red-500 focus:border-red-500 focus:ring-red-500/20', className)} {...props}>
          {placeholder && <option value="" disabled>{tx(placeholder)}</option>}
          {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{tx(option.label)}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      </div>
      {tx((error || hint) && <p id={descriptionId} role={error ? 'alert' : undefined} className={cn('mt-1.5 text-xs', error ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400')}>{tx(error ?? hint)}</p>)}
    </div>
  );
});
