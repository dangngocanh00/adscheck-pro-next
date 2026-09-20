import { useAppLanguage, tx, m } from '@/i18n'
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, FileQuestion, LockKeyhole } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cn } from './cn';
import { Button } from './button';

export interface StateViewProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
  className?: string;
  tone?: 'neutral' | 'danger' | 'warning';
}

const toneClasses = {
  neutral: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  danger: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
};

export function StateView({ title, description, icon: Icon = FileQuestion, actionLabel, onAction, action, className, tone = 'neutral' }: StateViewProps) {
  useAppLanguage();
  const titleId = useId();
  return (
    <section className={cn('flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700', className)} aria-labelledby={titleId}>
      <span className={cn('mb-4 flex size-12 items-center justify-center rounded-xl', toneClasses[tone])}><Icon className="size-6" aria-hidden="true" /></span>
      <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white">{tx(title)}</h2>
      <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">{tx(description)}</p>
      {tx((action || (actionLabel && onAction)) && <div className="mt-5">{tx(action ?? <Button onClick={onAction}>{tx(actionLabel)}</Button>)}</div>)}
    </section>
  );
}

export type EmptyStateProps = Omit<StateViewProps, 'tone'>;
export function EmptyState(props: EmptyStateProps) {
  useAppLanguage(); return <StateView {...props} />; }

export type ErrorStateProps = Omit<StateViewProps, 'icon' | 'tone'> & { icon?: LucideIcon };
export function ErrorState({ icon = AlertTriangle, actionLabel = m("ui.e353f2f3d3"), ...props }: ErrorStateProps) {
  useAppLanguage(); return <StateView icon={icon} tone="danger" actionLabel={actionLabel} {...props} />; }

export type NoPermissionStateProps = Omit<StateViewProps, 'icon' | 'tone'>;
export function NoPermissionState({ title = m("ui.ac1321e126"), description = m("ui.fc34574f8d"), ...props }: Partial<NoPermissionStateProps>) {
  useAppLanguage();
  return <StateView icon={LockKeyhole} tone="warning" title={tx(title)} description={tx(description)} {...props} />;
}
