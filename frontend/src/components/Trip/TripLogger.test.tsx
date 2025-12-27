import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TripLogger } from './TripLogger';

// Mock the stores and data
vi.mock('../../features/trips', () => ({
  useTripStore: () => ({
    addTrip: vi.fn(),
  }),
}));

const zones = [
  { id: 'downtown', name: 'Downtown Seattle' },
  { id: 'capitol-hill', name: 'Capitol Hill' },
  { id: 'seatac', name: 'SeaTac Airport' },
];

describe('TripLogger', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    zones,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<TripLogger {...defaultProps} />);
    // Title appears in header (h3) and submit button - use getAllByText
    const logTripElements = screen.getAllByText('Log Trip');
    expect(logTripElements.length).toBeGreaterThanOrEqual(1);
    expect(logTripElements[0]).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<TripLogger {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Log Trip')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<TripLogger {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays zone selection dropdown', () => {
    render(<TripLogger {...defaultProps} />);
    
    expect(screen.getByText('Zone *')).toBeInTheDocument();
    expect(screen.getByText('Select a zone...')).toBeInTheDocument();
  });

  it('displays all zones in dropdown', () => {
    render(<TripLogger {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Check zones are in options
    expect(screen.getByText('Downtown Seattle')).toBeInTheDocument();
    expect(screen.getByText('Capitol Hill')).toBeInTheDocument();
    expect(screen.getByText('SeaTac Airport')).toBeInTheDocument();
  });

  it('displays earnings input field', () => {
    render(<TripLogger {...defaultProps} />);
    expect(screen.getByText('Actual Earnings *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('displays duration input field', () => {
    render(<TripLogger {...defaultProps} />);
    expect(screen.getByText('Duration (minutes) *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('30')).toBeInTheDocument();
  });

  it('displays optional note field', () => {
    render(<TripLogger {...defaultProps} />);
    expect(screen.getByText('Note (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Any notes about this trip...')).toBeInTheDocument();
  });

  it('has a submit button', () => {
    render(<TripLogger {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Log Trip/i })).toBeInTheDocument();
  });

  it('is draggable - shows drag handle', () => {
    render(<TripLogger {...defaultProps} />);
    // DraggableCard shows GripVertical icon when draggable
    const dragHandle = document.querySelector('.cursor-grab');
    expect(dragHandle).toBeInTheDocument();
  });

  it('is resizable - shows maximize button', () => {
    render(<TripLogger {...defaultProps} />);
    expect(screen.getByLabelText(/Maximize|Restore/)).toBeInTheDocument();
  });

  it('is collapsible - shows collapse button', () => {
    render(<TripLogger {...defaultProps} />);
    expect(screen.getByLabelText(/Collapse|Expand/)).toBeInTheDocument();
  });
});

describe('TripLogger Form Validation', () => {
  it('requires zone selection', () => {
    render(<TripLogger isOpen={true} onClose={vi.fn()} zones={zones} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeRequired();
  });

  it('requires earnings input', () => {
    render(<TripLogger isOpen={true} onClose={vi.fn()} zones={zones} />);
    
    const earningsInput = screen.getByPlaceholderText('0.00');
    expect(earningsInput).toBeRequired();
  });

  it('requires duration input', () => {
    render(<TripLogger isOpen={true} onClose={vi.fn()} zones={zones} />);
    
    const durationInput = screen.getByPlaceholderText('30');
    expect(durationInput).toBeRequired();
  });
});

