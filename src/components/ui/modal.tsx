import { useAppLanguage, m, tx } from '@/i18n'
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';
import { useOverlayFocus } from './use-overlay-focus';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  closeLabel?: string;
}

const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export function Modal({ open, onClose, title, description, children, footer, size = 'md', className, closeLabel = m("ui.d2b73ab2ad") }: ModalProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useOverlayFocus(open, panelRef, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]" onMouseDown={onClose} aria-hidden="true" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className={cn('relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] shadow-xl', sizes[size], className)}>
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-[var(--text)]">{tx(title)}</h2>
            {tx(description && <p id={descriptionId} className="mt-1 text-sm text-[var(--text-muted)]">{tx(description)}</p>)}
          </div>
          <button type="button" onClick={onClose} aria-label={tx(closeLabel)} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"><X className="size-5" aria-hidden="true" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{tx(children)}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] px-5 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
