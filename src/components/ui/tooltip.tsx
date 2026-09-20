import { useAppLanguage, tx } from '@/i18n'
import { cloneElement, useId, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { cn } from './cn';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const positions = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  useAppLanguage();
  const id = useId();
  const [open, setOpen] = useState(false);
  const describedBy = [children.props['aria-describedby'], id].filter(Boolean).join(' ');
  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
    }
  };
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDownCapture={handleKeyDown}
    >
      {tx(cloneElement(children, { 'aria-describedby': describedBy }))}
      {tx(open && <span id={id} role="tooltip" className={cn('pointer-events-auto absolute z-50 w-max max-w-64 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-md dark:bg-slate-100 dark:text-slate-900', positions[side], className)}>{tx(content)}</span>)}
    </span>
  );
}
