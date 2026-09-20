import { useAppLanguage, tx, t } from '@/i18n'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { cn } from './cn';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export interface ToastInput { title: string; description?: string; variant?: ToastVariant; duration?: number; }
interface ToastItem extends ToastInput { id: string; }
interface ToastContextValue { toast: (input: ToastInput) => string; dismiss: (id: string) => void; }

const ToastContext = createContext<ToastContextValue | null>(null);
const iconMap: Record<ToastVariant, LucideIcon> = { success: CheckCircle2, error: AlertCircle, warning: TriangleAlert, info: Info };
const colorMap: Record<ToastVariant, string> = { success: 'text-green-600 dark:text-green-400', error: 'text-red-600 dark:text-red-400', warning: 'text-amber-600 dark:text-amber-400', info: 'text-blue-600 dark:text-blue-400' };

function ToastCard({ item, dismiss }: { item: ToastItem; dismiss: (id: string) => void }) {
  useAppLanguage();
  const variant = item.variant ?? 'info';
  const Icon = iconMap[variant];
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || item.duration === 0) return;
    const timer = window.setTimeout(() => dismiss(item.id), item.duration ?? 4000);
    return () => window.clearTimeout(timer);
  }, [dismiss, item.duration, item.id, paused]);
  return (
    <div className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900" role={variant === 'error' ? 'alert' : 'status'} aria-atomic="true" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <Icon className={cn('mt-0.5 size-5 shrink-0', colorMap[variant])} aria-hidden="true" />
      <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-900 dark:text-white">{tx(item.title)}</p>{tx(item.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tx(item.description)}</p>)}</div>
      <button type="button" onClick={() => dismiss(item.id)} className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label={t("ui.813b128487")}><X className="size-4" aria-hidden="true" /></button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  useAppLanguage();
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const toast = useCallback((input: ToastInput) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    setItems((current) => [...current, { ...input, id }]);
    return id;
  }, []);
  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {tx(children)}
      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {items.map((item) => <ToastCard key={item.id} item={item} dismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

// Provider and hook intentionally share one module so the public UI API stays cohesive.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context;
}
