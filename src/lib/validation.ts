import { z } from 'zod';

export const sanitizeText = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const emailSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(z.string().email('Please enter a valid email address').max(255, 'Email is too long'))
  .transform((email) => email.toLowerCase());

export const nameSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(z.string().min(1, 'Name is required').max(80, 'Name is too long'));

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long');

export const strictHttpsUrlSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(z.string().url('Please enter a valid URL').max(2000, 'URL is too long'))
  .refine((url) => url.startsWith('https://'), 'Link must start with https://');

export const sanitizeObject = <T extends Record<string, unknown>>(values: T): T => {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? sanitizeText(value) : value]),
  ) as T;
};