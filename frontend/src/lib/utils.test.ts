import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names and removes duplicates', () => {
    expect(cn('p-2', 'p-2', 'text-sm', false && 'hidden')).toBe('p-2 text-sm');
  });

  it('handles conditional class names', () => {
    const isActive = true;
    expect(cn('btn', isActive && 'btn-active')).toContain('btn-active');
  });
});


