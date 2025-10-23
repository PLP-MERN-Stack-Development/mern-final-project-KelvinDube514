import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlertCard from './AlertCard';

describe('AlertCard', () => {
  const baseAlert = {
    id: 1,
    type: 'critical' as const,
    title: 'Fire reported',
    location: 'Downtown',
    time: '2 mins ago',
    distance: '0.5 mi',
    verified: true,
    description: 'A building fire has been reported.',
  };

  it('renders alert information', () => {
    render(<AlertCard alert={baseAlert} />);
    expect(screen.getByText(/Fire reported/i)).toBeInTheDocument();
    expect(screen.getByText(/Downtown/i)).toBeInTheDocument();
    expect(screen.getByText(/2 mins ago/i)).toBeInTheDocument();
    expect(screen.getByText(/0.5 mi away/i)).toBeInTheDocument();
  });

  it('calls onViewDetails when button is clicked', async () => {
    const onViewDetails = vi.fn();
    render(<AlertCard alert={baseAlert} onViewDetails={onViewDetails} />);
    const button = screen.getByRole('button', { name: /view details/i });
    button.click();
    expect(onViewDetails).toHaveBeenCalledWith(baseAlert);
  });
});


