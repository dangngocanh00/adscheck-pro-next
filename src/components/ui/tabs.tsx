import { useAppLanguage, tx } from '@/i18n'
import { createContext, useContext, useId, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './cn';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab components must be used inside <Tabs>.');
  return context;
}

type TabsBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> & {
  onValueChange?: (value: string) => void;
};

export type TabsProps = TabsBaseProps & (
  | { value: string; defaultValue?: never }
  | { value?: never; defaultValue: string }
);

export function Tabs({ value, defaultValue, onValueChange, className, children, ...props }: TabsProps) {
  useAppLanguage();
  const [internalValue, setInternalValue] = useState(defaultValue ?? value);
  const baseId = useId();
  const currentValue = value ?? internalValue;
  const setValue = (next: string) => {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  };
  return <TabsContext.Provider value={{ value: currentValue, setValue, baseId }}><div className={className} {...props}>{tx(children)}</div></TabsContext.Provider>;
}

export interface TabListProps extends HTMLAttributes<HTMLDivElement> { label: string; }

export function TabList({ label, className, onKeyDown, ...props }: TabListProps) {
  useAppLanguage();
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next]?.focus();
    tabs[next]?.click();
  };
  return <div {...props} role="tablist" aria-label={tx(label)} className={cn('flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800', className)} onKeyDown={handleKeyDown} />;
}

export interface TabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> { value: string; }

export function Tab({ value, className, children, onClick, ...props }: TabProps) {
  useAppLanguage();
  const tabs = useTabs();
  const selected = tabs.value === value;
  const valueId = encodeURIComponent(value);
  return (
    <button {...props} type="button" role="tab" id={`${tabs.baseId}-tab-${valueId}`} aria-controls={`${tabs.baseId}-panel-${valueId}`} aria-selected={selected} tabIndex={selected ? 0 : -1} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) tabs.setValue(value); }} className={cn('relative min-h-11 shrink-0 px-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:text-white', selected && 'text-blue-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-600 dark:text-blue-400', className)}>
      {tx(children)}
    </button>
  );
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> { value: string; children: ReactNode; }

export function TabPanel({ value, className, ...props }: TabPanelProps) {
  useAppLanguage();
  const tabs = useTabs();
  if (tabs.value !== value) return null;
  const valueId = encodeURIComponent(value);
  return <div role="tabpanel" id={`${tabs.baseId}-panel-${valueId}`} aria-labelledby={`${tabs.baseId}-tab-${valueId}`} tabIndex={0} className={cn('focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500', className)} {...props} />;
}
