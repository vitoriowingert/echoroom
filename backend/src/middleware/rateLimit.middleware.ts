import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, use Redis)
const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

// Utility function to clear rate limit store (useful for development/testing)
export function clearRateLimitStore(key?: string): void {
  if (key) {
    delete store[key];
  } else {
    // Clear all entries
    Object.keys(store).forEach((k) => delete store[k]);
  }
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

// More lenient limits in development
const isDevelopment = process.env.NODE_ENV !== 'production';

const defaultOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // 1000 requests in dev, 100 in production
  message: 'Too many requests, please try again later.',
};

export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = opts.keyGenerator
      ? opts.keyGenerator(req)
      : (req as AuthenticatedRequest).userId || req.ip || 'anonymous';

    const now = Date.now();
    const record = store[key];

    if (!record || record.resetTime < now) {
      // Create new record
      store[key] = {
        count: 1,
        resetTime: now + opts.windowMs,
      };
      return next();
    }

    // Increment count
    record.count++;

    if (record.count > opts.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.status(429).json({
        error: opts.message,
        retryAfter,
      });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // More lenient in development
  message: 'Too many requests, please try again later.',
});

export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests
  message: 'Too many requests, please slow down.',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: (req) => `auth:${req.ip}`,
});

export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: 'You are sending messages too quickly, please slow down.',
  keyGenerator: (req) => {
    const authReq = req as AuthenticatedRequest;
    return `messages:${authReq.userId || req.ip}`;
  },
});

