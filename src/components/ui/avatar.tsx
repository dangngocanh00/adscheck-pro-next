import { useAppLanguage, tx, t } from '@/i18n'
import { Children, type HTMLAttributes, type ImgHTMLAttributes } from 'react';
import { cn } from './cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  src?: string;
  alt: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy';
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>;
}

const sizes: Record<AvatarSize, string> = { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-12 text-base', xl: 'size-16 text-xl' };
const statusColors = { online: 'bg-green-500', offline: 'bg-slate-400', busy: 'bg-red-500' };

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase()).join('');
}

export function Avatar({ src, alt, name = alt, size = 'md', status, className, imgProps, ...props }: AvatarProps) {
  useAppLanguage();
  return (
    <span className={cn('relative inline-flex shrink-0', sizes[size], className)} {...props}>
      {tx(src ? (
        <img className="size-full rounded-full object-cover" src={src} alt={tx(alt)} {...imgProps} />
      ) : (
        <span className="flex size-full items-center justify-center rounded-full bg-blue-100 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300" role="img" aria-label={tx(alt)}>
          {initials(name)}
        </span>
      ))}
      {tx(status && <><span className={cn('absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white dark:border-slate-900', statusColors[status])} aria-hidden="true" /><span className="sr-only">{t("ui.d7b8829cb1")}{" "}{tx(status)}</span></>)}
    </span>
  );
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> { max?: number; }

export function AvatarGroup({ max = 4, children, className, ...props }: AvatarGroupProps) {
  useAppLanguage();
  const items = Children.toArray(children);
  const visible = items.slice(0, max);
  const remaining = Math.max(items.length - max, 0);
  return (
    <div className={cn('flex -space-x-2 [&>*]:ring-2 [&>*]:ring-white dark:[&>*]:ring-slate-900', className)} {...props}>
      {visible}
      {tx(remaining > 0 && <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 ring-2 ring-white dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-900">+{remaining}</span>)}
    </div>
  );
}
