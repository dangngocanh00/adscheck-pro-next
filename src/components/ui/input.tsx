import { useAppLanguage, tx } from '@/i18n'
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingContent?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, leadingIcon, trailingContent, required, className, 'aria-describedby': ariaDescribedBy, ...props },
  ref,
) {
  useAppLanguage();
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const descriptionId = `${inputId}-${error ? 'error' : 'hint'}`;
  const describedBy = [ariaDescribedBy, (error || hint) ? descriptionId : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <div className="w-full">
      {tx(label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{tx(label)}{tx(required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>)}</label>)}
      <div className="relative">
        {tx(leadingIcon && <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">{leadingIcon}</span>)}
        <input ref={ref} id={inputId} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} className={cn('min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800', Boolean(leadingIcon) && 'pl-10', Boolean(trailingContent) && 'pr-10', Boolean(error) && 'border-red-500 focus:border-red-500 focus:ring-red-500/20', className)} {...props} />
        {tx(trailingContent && <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">{trailingContent}</span>)}
      </div>
      {tx((error || hint) && <p id={descriptionId} role={error ? 'alert' : undefined} className={cn('mt-1.5 text-xs', error ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400')}>{tx(error ?? hint)}</p>)}
    </div>
  );
});
