/**
 * Sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitizes HTML strings by escaping dangerous characters
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Sanitizes CSS strings by escaping dangerous characters
 */
export function sanitizeCss(css: string): string {
  // Remove any CSS that could execute JavaScript
  return css.replace(/[<>"'`]/g, '');
}

/**
 * Sanitizes a string for use in style attributes
 */
export function sanitizeStyleValue(value: string): string {
  // Remove dangerous characters and validate it's a safe CSS value
  return value.replace(/[<>"'`;]/g, '');
}

/**
 * Sanitizes an emoji string - only allows safe emojis
 */
export function sanitizeEmoji(emoji: string): string {
  // Only allow emojis and basic symbols, no HTML or script tags
  const safeEmoji = emoji.replace(/[<>"'`&]/g, '');
  
  // Additional validation: ensure it's a single character or common emoji sequence
  const emojiRegex = /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Presentation}]+$/u;
  
  if (emojiRegex.test(safeEmoji) && safeEmoji.length <= 5) {
    return safeEmoji;
  }
  
  // Fallback to a safe default
  return '📍';
}

/**
 * Sanitizes event data for safe display
 */
export function sanitizeEventData(event: {
  name: string;
  venue: string;
  type?: string;
  imageUrl?: string;
}): {
  name: string;
  venue: string;
  type?: string;
  imageUrl?: string;
} {
  return {
    name: sanitizeHtml(event.name),
    venue: sanitizeHtml(event.venue),
    type: event.type ? sanitizeHtml(event.type) : undefined,
    imageUrl: event.imageUrl ? sanitizeUrl(event.imageUrl) : undefined,
  };
}

/**
 * Sanitizes a URL for safe use in attributes
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
  } catch {
    // Invalid URL, return empty string
  }
  return '';
}

/**
 * Creates safe HTML for Leaflet markers
 */
export function createSafeMarkerHtml(options: {
  emoji: string;
  isUrgent: boolean;
  ringColor: string;
  glowColor: string;
}): string {
  const safeEmoji = sanitizeEmoji(options.emoji);
  const safeRingColor = sanitizeStyleValue(options.ringColor);
  const safeGlowColor = sanitizeStyleValue(options.glowColor);
  
  let html = `
    <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
  `;
  
  if (options.isUrgent) {
    html += `
      <div class="animate-pulse" style="
        position: absolute;
        width: 40px;
        height: 40px;
        border: 3px solid ${safeRingColor};
        border-radius: 50%;
        box-shadow: 0 0 15px ${safeGlowColor};
      "></div>
    `;
  }
  
  html += `
      <div style="
        font-size: 32px;
        text-shadow: 0 0 10px ${safeGlowColor};
        filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6));
        position: relative;
        z-index: 10;
      ">
        ${safeEmoji}
      </div>
    </div>
  `;
  
  return html;
}

/**
 * Creates safe HTML for current position marker
 */
export function createSafeCurrentPositionHtml(): string {
  return `
    <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
      <!-- Outer pulsing ring -->
      <div style="
        position: absolute;
        width: 56px;
        height: 56px;
        border: 3px solid #e82127;
        border-radius: 50%;
        animation: teslaPulse 2s ease-in-out infinite;
      "></div>
      <!-- Inner solid circle background -->
      <div style="
        position: absolute;
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border-radius: 50%;
        border: 2px solid #e82127;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
      "></div>
      <!-- Tesla "T" Logo -->
      <svg width="28" height="28" viewBox="0 0 100 100" style="position: relative; z-index: 10;">
        <!-- Tesla T shape -->
        <path d="M50 10 L50 90 M20 10 L80 10" 
              stroke="#e82127" 
              stroke-width="14" 
              stroke-linecap="round" 
              fill="none"/>
        <!-- Highlight on T -->
        <path d="M50 10 L50 85" 
              stroke="url(#teslaGradient)" 
              stroke-width="8" 
              stroke-linecap="round" 
              fill="none"/>
        <defs>
          <linearGradient id="teslaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ff4444"/>
            <stop offset="100%" style="stop-color:#cc0000"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
    <style>
      @keyframes teslaPulse {
        0%, 100% { 
          transform: scale(1); 
          opacity: 0.7;
          box-shadow: 0 0 0 0 rgba(232, 33, 39, 0.4);
        }
        50% { 
          transform: scale(1.15); 
          opacity: 1;
          box-shadow: 0 0 20px 5px rgba(232, 33, 39, 0.3);
        }
      }
    </style>
  `;
}


