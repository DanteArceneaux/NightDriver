import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableCard } from './DraggableCard';

describe('DraggableCard', () => {
  const defaultProps = {
    title: 'Test Card',
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Test Content</div>,
  };

  it('renders when isOpen is true', () => {
    render(<DraggableCard {...defaultProps} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<DraggableCard {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Card')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<DraggableCard {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows collapse button when collapsible is true', () => {
    render(<DraggableCard {...defaultProps} collapsible={true} />);
    expect(screen.getByLabelText(/Collapse|Expand/)).toBeInTheDocument();
  });

  it('hides collapse button when collapsible is false', () => {
    render(<DraggableCard {...defaultProps} collapsible={false} />);
    expect(screen.queryByLabelText(/Collapse|Expand/)).not.toBeInTheDocument();
  });

  it('shows maximize button when resizable is true', () => {
    render(<DraggableCard {...defaultProps} resizable={true} />);
    expect(screen.getByLabelText(/Maximize|Restore/)).toBeInTheDocument();
  });

  it('hides maximize button when resizable is false', () => {
    render(<DraggableCard {...defaultProps} resizable={false} />);
    expect(screen.queryByLabelText(/Maximize|Restore/)).not.toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(
      <DraggableCard 
        {...defaultProps} 
        icon={<span data-testid="custom-icon">🎯</span>} 
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <DraggableCard {...defaultProps} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('has correct aria labels for accessibility', () => {
    render(<DraggableCard {...defaultProps} />);
    
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
    expect(screen.getByLabelText('Collapse')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximize')).toBeInTheDocument();
  });

  it('toggles collapse state when collapse button clicked', () => {
    render(<DraggableCard {...defaultProps} collapsible={true} />);
    
    // Content should be in document initially
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    
    // Click collapse button
    const collapseButton = screen.getByLabelText('Collapse');
    fireEvent.click(collapseButton);
    
    // Button label should change to Expand
    expect(screen.getByLabelText('Expand')).toBeInTheDocument();
  });
});

describe('DraggableCard Responsiveness', () => {
  it('uses full width on mobile viewport', () => {
    // Window is mocked to 430px (iPhone 16 Pro Max) in setup
    const { container } = render(
      <DraggableCard
        title="Mobile Test"
        isOpen={true}
        onClose={vi.fn()}
        className="!w-[calc(100vw-32px)] md:!w-80"
      >
        Content
      </DraggableCard>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('max-w-[calc(100vw-16px)]');
  });
});

