import clsx, { type ClassValue } from 'clsx';

/** Merge class names; caller-supplied classes always land last. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
