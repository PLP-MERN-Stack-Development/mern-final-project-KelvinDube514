import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render, cleanupTest } from '@/test/testUtils';
import Navigation from './Navigation';

describe('Navigation', () => {
  beforeEach(() => {
    cleanupTest();
  });

  it('renders navigation component', () => {
    render(<Navigation />);
    
    // Check that navigation renders without crashing
    const nav = screen.getByRole('navigation') || document.querySelector('nav');
    expect(nav).toBeTruthy();
  });

  it('renders navigation links', () => {
    render(<Navigation />);
    
    // Check for navigation links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('renders interactive elements', () => {
    render(<Navigation />);
    
    // Navigation should have interactive elements (buttons or links)
    const buttons = screen.queryAllByRole('button');
    const links = screen.getAllByRole('link');
    
    expect(buttons.length + links.length).toBeGreaterThan(0);
  });
});
