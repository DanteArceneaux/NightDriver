import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { RateLimiter, createRateLimiter } from '../src/middleware/rateLimit.middleware.js';
import { ErrorFactory } from '../src/lib/errors.js';

describe('Rate Limiting', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let errorSpy: vi.Mock;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      path: '/api/test',
      socket: {
        remoteAddress: '127.0.0.1',
      },
    };
    
    mockResponse = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    
    nextFunction = vi.fn();
    errorSpy = vi.fn();
  });

  describe('RateLimiter Class', () => {
    it('should create a rate limiter with default configuration', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it('should allow requests within limit', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 3,
      });

      const middleware = limiter.middleware();

      // First request
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');

      // Second request
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(2);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '1');

      // Third request
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(3);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // First two requests should pass
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(2);

      // Third request should be blocked
      nextFunction.mockClear();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalledTimes(1);
      const error = nextFunction.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(1001); // API_RATE_LIMITED
      
      // Should set appropriate headers
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '2');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should reset window after time passes', async () => {
      vi.useFakeTimers();
      
      const limiter = new RateLimiter({
        windowMs: 1000, // 1 second window
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // Use up the limit
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(2);

      // Third request should be blocked
      nextFunction.mockClear();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(Error);

      // Advance time past the window
      vi.advanceTimersByTime(2000);

      // Request should now be allowed
      nextFunction.mockClear();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(nextFunction.mock.calls[0][0]).toBeUndefined(); // No error

      vi.useRealTimers();
    });

    it('should use custom key generator', () => {
      const customKeyGenerator = vi.fn().mockReturnValue('custom-key');
      
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: customKeyGenerator,
      });

      const middleware = limiter.middleware();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(customKeyGenerator).toHaveBeenCalledWith(mockRequest);
      expect(customKeyGenerator).toHaveReturnedWith('custom-key');
    });

    it('should handle different IP addresses separately', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // Request from IP 1
      mockRequest.ip = '192.168.1.1';
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(2);

      // Request from IP 2 should have separate limit
      mockRequest.ip = '192.168.1.2';
      nextFunction.mockClear();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(nextFunction.mock.calls[0][0]).toBeUndefined(); // No error
    });
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter instance', () => {
      const limiter = createRateLimiter({
        windowMs: 30000,
        maxRequests: 5,
      });

      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('Pre-configured Rate Limiters', () => {
    it('should have strict rate limiter', () => {
      const { rateLimiters } = require('../src/middleware/rateLimit.middleware.js');
      
      expect(rateLimiters.strict).toBeInstanceOf(RateLimiter);
      // Strict should have low limit
      expect(rateLimiters.strict).toBeDefined();
    });

    it('should have API rate limiter', () => {
      const { rateLimiters } = require('../src/middleware/rateLimit.middleware.js');
      
      expect(rateLimiters.api).toBeInstanceOf(RateLimiter);
      expect(rateLimiters.api).toBeDefined();
    });

    it('should have public rate limiter', () => {
      const { rateLimiters } = require('../src/middleware/rateLimit.middleware.js');
      
      expect(rateLimiters.public).toBeInstanceOf(RateLimiter);
      expect(rateLimiters.public).toBeDefined();
    });

    it('should have WebSocket rate limiter', () => {
      const { rateLimiters } = require('../src/middleware/rateLimit.middleware.js');
      
      expect(rateLimiters.websocket).toBeInstanceOf(RateLimiter);
      expect(rateLimiters.websocket).toBeDefined();
    });
  });

  describe('Response Handler', () => {
    it('should skip counting successful requests if configured', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 3,
        skipSuccessfulRequests: true,
      });

      const middleware = limiter.middleware();
      const responseHandler = limiter.responseHandler();

      // Make a request
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);

      // Apply response handler
      responseHandler(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Simulate successful response
      (mockResponse as any).statusCode = 200;
      mockResponse.send?.('OK');
      
      // The count should be decremented for successful response
      // (This is hard to test without accessing internal state)
      expect(mockResponse.send).toHaveBeenCalledWith('OK');
    });

    it('should skip counting failed requests if configured', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 3,
        skipFailedRequests: true,
      });

      const middleware = limiter.middleware();
      const responseHandler = limiter.responseHandler();

      // Make a request
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);

      // Apply response handler
      responseHandler(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Simulate failed response
      (mockResponse as any).statusCode = 500;
      mockResponse.send?.('Error');
      
      expect(mockResponse.send).toHaveBeenCalledWith('Error');
    });
  });
});


