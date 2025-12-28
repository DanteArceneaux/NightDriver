/**
 * Rate limiting middleware for Express
 * Uses sliding window algorithm with in-memory storage
 * For production, consider using Redis for distributed rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorFactory } from '../lib/errors.js';

interface RateLimitWindow {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

class RateLimiter {
  private store: Map<string, RateLimitWindow>;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.store = new Map();
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      message: config.message || 'Too many requests, please try again later.',
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
    };
  }

  private defaultKeyGenerator(req: Request): string {
    // Use IP address as default key
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `rate-limit:${ip}:${req.path}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, window] of this.store.entries()) {
      if (window.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Run cleanup occasionally (every 1000 requests)
      if (Math.random() < 0.001) {
        this.cleanup();
      }

      const key = this.config.keyGenerator(req);
      const now = Date.now();
      
      // Get or create window
      let window = this.store.get(key);
      if (!window || window.resetTime < now) {
        window = {
          count: 0,
          resetTime: now + this.config.windowMs,
        };
        this.store.set(key, window);
      }

      // Check if limit exceeded
      if (window.count >= this.config.maxRequests) {
        const retryAfter = Math.ceil((window.resetTime - now) / 1000);
        
        res.setHeader('Retry-After', retryAfter.toString());
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', window.resetTime.toString());
        
        return next(ErrorFactory.apiRateLimited('API', retryAfter));
      }

      // Increment counter
      window.count++;

      // Set response headers
      const remaining = Math.max(0, this.config.maxRequests - window.count);
      res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', window.resetTime.toString());

      // Store the window for response handling
      (req as any).rateLimitWindow = window;

      next();
    };
  }

  // Response handler to skip counting successful/failed requests if configured
  responseHandler() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      const window = (req as any).rateLimitWindow;

      if (!window) {
        return next();
      }

      res.send = function(body: any) {
        const shouldSkip = 
          (this.config.skipSuccessfulRequests && res.statusCode < 400) ||
          (this.config.skipFailedRequests && res.statusCode >= 400);

        if (shouldSkip && window.count > 0) {
          window.count--;
        }

        return originalSend.call(this, body);
      }.bind({ config: this.config });

      next();
    };
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Strict limits for authentication endpoints
  strict: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many authentication attempts, please try again later.',
  }),

  // Standard limits for API endpoints
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'Too many API requests, please slow down.',
  }),

  // Generous limits for public endpoints
  public: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
    message: 'Too many requests, please try again later.',
  }),

  // Very generous limits for WebSocket connections (per connection)
  websocket: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300, // 300 messages per minute per connection
    message: 'Too many messages, please slow down.',
  }),
};

// Helper function to create custom rate limiters
export function createRateLimiter(config: RateLimitConfig) {
  return new RateLimiter(config);
}

// Middleware for different endpoint types
export const rateLimitMiddleware = {
  strict: rateLimiters.strict.middleware(),
  api: rateLimiters.api.middleware(),
  public: rateLimiters.public.middleware(),
  websocket: rateLimiters.websocket.middleware(),
};

// Export the RateLimiter class for custom use
export { RateLimiter };
export type { RateLimitConfig, RateLimitWindow };
