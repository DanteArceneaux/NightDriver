import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoneDetailSheet } from './ZoneDetailSheet';

// Mock navigation functions
vi.mock('../../lib/navigation', () => ({
  openGoogleMaps: vi.fn(),
  openWaze: vi.fn(),
  openAppleMaps: vi.fn(),
}));

describe('ZoneDetailSheet', () => {
  const mockZone = {
    id: 'downtown',
    name: 'Downtown Seattle',
    score: 75,
    trend: 'rising' as const,
    estimatedHourlyRate: 32,
    coordinates: { lat: 47.6062, lng: -122.3321 },
    factors: {
      baseline: 40,
      events: 15,
      weather: 10,
      flights: 0,
      traffic: 5,
    },
  };

  const defaultProps = {
    zone: mockZone,
    onClose: vi.fn(),
  };

  it('renders when zone is provided', () => {
    render(<ZoneDetailSheet {...defaultProps} />);
    expect(screen.getByText('Downtown Seattle')).toBeInTheDocument();
  });

  it('does not render when zone is null', () => {
    render(<ZoneDetailSheet zone={null} onClose={vi.fn()} />);
    expect(screen.queryByText('Downtown Seattle')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ZoneDetailSheet {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays the zone score', () => {
    render(<ZoneDetailSheet {...defaultProps} />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('displays score breakdown', () => {
    render(<ZoneDetailSheet {...defaultProps} />);
    
    expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Baseline')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('displays event factor when greater than 0', () => {
    render(<ZoneDetailSheet {...defaultProps} />);
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  it('displays weather factor when greater than 0', () => {
    render(<ZoneDetailSheet {...defaultProps} />);
    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('displays navigation buttons', () => {
    render(<ZoneDetailSheet {...defaultProps} />);
    
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Waze')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('is draggable - has drag header', () => {
    render(<ZoneDetailSheet {...defaultProps} />);
    // DraggableCard has a cursor-grab class on the header
    const dragHandle = document.querySelector('.cursor-grab');
    expect(dragHandle).toBeInTheDocument();
  });

  it('is resizable - shows maximize button', () => {
    render(<ZoneDetailSheet {...defaultProps} />);
    expect(screen.getByLabelText(/Maximize|Restore/)).toBeInTheDocument();
  });

  it('is collapsible - shows collapse button', () => {
    render(<ZoneDetailSheet {...defaultProps} />);
    expect(screen.getByLabelText(/Collapse|Expand/)).toBeInTheDocument();
  });

  it('displays coordinates', () => {
    render(<ZoneDetailSheet {...defaultProps} />);
    expect(screen.getByText('47.6062, -122.3321')).toBeInTheDocument();
  });
});

describe('ZoneDetailSheet with Driver Location', () => {
  const mockZone = {
    id: 'downtown',
    name: 'Downtown Seattle',
    score: 75,
    trend: 'stable' as const,
    estimatedHourlyRate: 32,
    coordinates: { lat: 47.6062, lng: -122.3321 },
    factors: {
      baseline: 40,
      events: 15,
      weather: 10,
      flights: 0,
      traffic: 5,
    },
  };

  const driverLocation = { lat: 47.6253, lng: -122.3222 };

  it('displays distance when driver location is provided', () => {
    render(
      <ZoneDetailSheet 
        zone={mockZone} 
        onClose={vi.fn()} 
        driverLocation={driverLocation}
      />
    );
    
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Drive Time')).toBeInTheDocument();
    expect(screen.getByText('Efficiency')).toBeInTheDocument();
  });
});

describe('ZoneDetailSheet Score Colors', () => {
  it('applies pink theme for high scores (>=80)', () => {
    const highScoreZone = {
      id: 'test',
      name: 'High Score Zone',
      score: 85,
      trend: 'rising' as const,
      estimatedHourlyRate: 40,
      coordinates: { lat: 47.6, lng: -122.3 },
      factors: { baseline: 50, events: 25, weather: 10, flights: 0, traffic: 0 },
    };

    render(<ZoneDetailSheet zone={highScoreZone} onClose={vi.fn()} />);
    
    const scoreElement = screen.getByText('85');
    expect(scoreElement).toHaveClass('text-neon-pink');
  });

  it('applies orange theme for medium-high scores (>=60)', () => {
    const mediumHighZone = {
      id: 'test',
      name: 'Medium High Zone',
      score: 65,
      trend: 'stable' as const,
      estimatedHourlyRate: 30,
      coordinates: { lat: 47.6, lng: -122.3 },
      factors: { baseline: 40, events: 15, weather: 10, flights: 0, traffic: 0 },
    };

    render(<ZoneDetailSheet zone={mediumHighZone} onClose={vi.fn()} />);
    
    const scoreElement = screen.getByText('65');
    expect(scoreElement).toHaveClass('text-neon-orange');
  });
});



