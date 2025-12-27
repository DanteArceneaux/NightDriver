import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';

// Mock the stores
vi.mock('../../features/settings/store', () => ({
  useSettingsStore: () => ({
    voiceAlerts: false,
    surgeAlertThreshold: 20,
    eventAlertMinutes: 30,
    baseHourlyRate: 25,
    offlineMode: false,
    neonColorScheme: 'default',
    proColorScheme: 'default',
    hudColorScheme: 'default',
    carColorScheme: 'default',
    updateSettings: vi.fn(),
    setColorScheme: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('../../features/theme', () => ({
  useTheme: () => ({
    id: 'neon',
    tokens: {},
  }),
}));

describe('SettingsModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<SettingsModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('displays all three tabs', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('shows Appearance content by default', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Color Scheme')).toBeInTheDocument();
  });

  it('switches to Alerts tab when clicked', () => {
    render(<SettingsModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Alerts'));
    
    expect(screen.getByText('Alert Settings')).toBeInTheDocument();
    expect(screen.getByText('Voice Alerts')).toBeInTheDocument();
  });

  it('switches to Preferences tab when clicked', () => {
    render(<SettingsModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Preferences'));
    
    expect(screen.getByText('Personal Settings')).toBeInTheDocument();
    expect(screen.getByText('Offline Mode')).toBeInTheDocument();
  });

  it('displays color scheme options', () => {
    render(<SettingsModal {...defaultProps} />);
    
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Ocean Blue')).toBeInTheDocument();
    expect(screen.getByText('Royal Purple')).toBeInTheDocument();
    expect(screen.getByText('Forest Green')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal {...defaultProps} onClose={onClose} />);
    
    // Find and click the backdrop (first fixed element with bg-black/70)
    const backdrop = document.querySelector('.bg-black\\/70');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('shows reset button in Preferences tab', () => {
    render(<SettingsModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Preferences'));
    
    expect(screen.getByText('Reset All Settings')).toBeInTheDocument();
  });
});

describe('SettingsModal Accessibility', () => {
  it('has proper heading structure', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    
    // Check for heading elements
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('has accessible tab buttons', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    
    const tabs = screen.getAllByRole('button');
    expect(tabs.length).toBeGreaterThan(3); // At least 3 tabs + close button
  });
});

