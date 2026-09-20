export type ClassValue = string | false | null | undefined;

/** Joins conditional class names without an external dependency. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
