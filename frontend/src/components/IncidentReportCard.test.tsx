import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render, mockIncident } from '@/test/testUtils';
import IncidentReportCard from './IncidentReportCard';

describe('IncidentReportCard', () => {
  const mockOnClick = vi.fn();

  it('renders incident information correctly', () => {
    render(<IncidentReportCard incident={mockIncident} onClick={mockOnClick} />);
    
    expect(screen.getByText(mockIncident.title)).toBeInTheDocument();
    expect(screen.getByText(mockIncident.description)).toBeInTheDocument();
  });

  it('displays severity badge', () => {
    render(<IncidentReportCard incident={mockIncident} onClick={mockOnClick} />);
    
    // Check for severity indicator
    const severityElement = screen.getByText(/medium/i);
    expect(severityElement).toBeInTheDocument();
  });

  it('displays location information', () => {
    render(<IncidentReportCard incident={mockIncident} onClick={mockOnClick} />);
    
    const locationText = screen.getByText(/New York/i);
    expect(locationText).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(<IncidentReportCard incident={mockIncident} onClick={mockOnClick} />);
    
    const card = screen.getByText(mockIncident.title).closest('div');
    if (card) {
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalledWith(mockIncident);
    }
  });

  it('displays incident type', () => {
    render(<IncidentReportCard incident={mockIncident} onClick={mockOnClick} />);
    
    const typeElement = screen.getByText(/crime/i);
    expect(typeElement).toBeInTheDocument();
  });

  it('shows timestamp', () => {
    render(<IncidentReportCard incident={mockIncident} onClick={mockOnClick} />);
    
    // Should display some form of date/time
    const dateElement = screen.getByText(/2024/i) || screen.getByText(/ago/i);
    expect(dateElement).toBeInTheDocument();
  });
});
