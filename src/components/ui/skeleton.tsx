import { useAppLanguage, t } from '@/i18n'
import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const roundedClasses = { sm: 'rounded', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' };

export function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
  useAppLanguage();
  return <div aria-hidden="true" className={cn('animate-pulse bg-slate-200 dark:bg-slate-800', roundedClasses[rounded], className)} {...props} />;
}

export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> { lines?: number; }

export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  useAppLanguage();
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true" {...props}>
      {Array.from({ length: lines }, (_, index) => <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />)}
    </div>
  );
}

export function CardSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  useAppLanguage();
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900', className)} aria-label={t("ui.f774f2161e")} role="status" {...props}>
      <div className="flex items-center gap-3"><Skeleton rounded="full" className="size-10" /><div className="flex-1"><Skeleton className="h-4 w-1/2" /><Skeleton className="mt-2 h-3 w-1/3" /></div></div>
      <SkeletonText className="mt-5" lines={3} />
    </div>
  );
}
