/**
 * Accessibility utilities for consistent ARIA labels and attributes
 */

/**
 * Get ARIA label for zone cards based on score and name
 */
export function getZoneAriaLabel(zoneName: string, score: number, estimatedHourlyRate: number): string {
  const scoreDescription = score >= 80 ? 'hot zone' : score >= 60 ? 'busy zone' : score >= 40 ? 'moderate zone' : 'quiet zone';
  return `${zoneName}, ${scoreDescription} with score ${score}, estimated hourly rate $${estimatedHourlyRate}`;
}

/**
 * Get ARIA label for buttons
 */
export function getButtonAriaLabel(action: string, context?: string): string {
  if (context) {
    return `${action} ${context}`;
  }
  return action;
}

/**
 * Get ARIA label for toggle buttons
 */
export function getToggleAriaLabel(isOn: boolean, action: string): string {
  return `${isOn ? 'Turn off' : 'Turn on'} ${action}`;
}

/**
 * Get ARIA label for navigation items
 */
export function getNavAriaLabel(item: string, isCurrent?: boolean): string {
  if (isCurrent) {
    return `${item}, current page`;
  }
  return `Go to ${item}`;
}

/**
 * Get ARIA label for status indicators
 */
export function getStatusAriaLabel(status: string, context: string): string {
  return `${context} status: ${status}`;
}

/**
 * Get ARIA label for progress indicators
 */
export function getProgressAriaLabel(current: number, total: number, context: string): string {
  return `${context}: ${current} of ${total}`;
}

/**
 * Get ARIA label for time-based elements
 */
export function getTimeAriaLabel(time: string, context: string): string {
  return `${context}: ${time}`;
}

/**
 * Get ARIA label for map elements
 */
export function getMapAriaLabel(element: string, context?: string): string {
  if (context) {
    return `${element} on map: ${context}`;
  }
  return `${element} on map`;
}

/**
 * Get ARIA label for score indicators
 */
export function getScoreAriaLabel(score: number, context: string): string {
  const description = score >= 80 ? 'very high' : 
                     score >= 60 ? 'high' : 
                     score >= 40 ? 'moderate' : 
                     'low';
  return `${context} score: ${score} (${description})`;
}

/**
 * Get ARIA label for distance indicators
 */
export function getDistanceAriaLabel(distance: number, unit: 'km' | 'miles' = 'km'): string {
  const formattedDistance = unit === 'km' ? 
    `${distance.toFixed(1)} kilometers` : 
    `${(distance * 0.621371).toFixed(1)} miles`;
  return `Distance: ${formattedDistance}`;
}

/**
 * Get ARIA label for drive time indicators
 */
export function getDriveTimeAriaLabel(minutes: number): string {
  if (minutes < 60) {
    return `Drive time: ${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `Drive time: ${hours} hours ${mins} minutes`;
}

/**
 * Get ARIA live region attributes for dynamic content
 */
export function getLiveRegionAttributes(politeness: 'off' | 'polite' | 'assertive' = 'polite'): {
  'aria-live': 'off' | 'polite' | 'assertive';
  'aria-atomic': boolean;
} {
  return {
    'aria-live': politeness,
    'aria-atomic': true,
  };
}

/**
 * Get ARIA attributes for loading states
 */
export function getLoadingAttributes(isLoading: boolean): {
  'aria-busy': boolean;
  'aria-label'?: string;
} {
  return {
    'aria-busy': isLoading,
    ...(isLoading && { 'aria-label': 'Loading, please wait' }),
  };
}

/**
 * Get ARIA attributes for error states
 */
export function getErrorAttributes(hasError: boolean, errorMessage?: string): {
  'aria-invalid': boolean;
  'aria-errormessage'?: string;
} {
  return {
    'aria-invalid': hasError,
    ...(hasError && errorMessage && { 'aria-errormessage': `error-${errorMessage.replace(/\s+/g, '-').toLowerCase()}` }),
  };
}
