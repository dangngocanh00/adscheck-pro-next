import { useAppLanguage, tx, t } from '@/i18n'
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';
import { useOverlayFocus } from './use-overlay-focus';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg';
  className?: string;
}

const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl' };

export function Drawer({ open, onClose, title, description, children, footer, side = 'right', width = 'md', className }: DrawerProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useOverlayFocus(open, panelRef, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 bg-slate-950/50" onMouseDown={onClose} aria-hidden="true" />
      <aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className={cn('absolute inset-y-0 flex w-[calc(100%-2rem)] flex-col bg-[var(--surface-raised)] text-[var(--text)] shadow-2xl', side === 'right' ? 'right-0 border-l border-[var(--border)]' : 'left-0 border-r border-[var(--border)]', widths[width], className)}>
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-[var(--text)]">{tx(title)}</h2>
            {tx(description && <p id={descriptionId} className="mt-1 text-sm text-[var(--text-muted)]">{tx(description)}</p>)}
          </div>
          <button type="button" onClick={onClose} aria-label={t("ui.0f7529fac0")} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"><X className="size-5" aria-hidden="true" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{tx(children)}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] px-5 py-4">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}
