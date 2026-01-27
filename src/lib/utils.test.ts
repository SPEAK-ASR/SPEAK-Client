import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('handles conditional class names', () => {
    expect(cn('flex', true && 'items-center', false && 'justify-center')).toBe('flex items-center');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('handles null and undefined', () => {
    expect(cn('base', null, undefined)).toBe('base');
  });
});
