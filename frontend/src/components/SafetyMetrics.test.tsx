import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/testUtils';
import SafetyMetrics from './SafetyMetrics';

describe('SafetyMetrics', () => {
  const mockMetrics = {
    totalIncidents: 150,
    activeAlerts: 5,
    resolvedIncidents: 120,
    responseTime: '15 min',
  };

  it('renders all metrics', () => {
    render(<SafetyMetrics {...mockMetrics} />);
    
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('displays metric labels', () => {
    render(<SafetyMetrics {...mockMetrics} />);
    
    expect(screen.getByText(/Total Incidents/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Resolved/i)).toBeInTheDocument();
    expect(screen.getByText(/Response Time/i)).toBeInTheDocument();
  });

  it('handles zero values', () => {
    const zeroMetrics = {
      totalIncidents: 0,
      activeAlerts: 0,
      resolvedIncidents: 0,
      responseTime: '0 min',
    };
    
    render(<SafetyMetrics {...zeroMetrics} />);
    
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });
});
