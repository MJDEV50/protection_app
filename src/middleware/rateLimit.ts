import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Auth rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 min
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
});

// SOS rate limiter (very strict - prevent false alerts)
export const sosLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2, // Only 2 SOS per minute (accidental double-tap allowed)
  message: 'Too many SOS alerts. Please wait before triggering another.',
  standardHeaders: true,
});

// Location update limiter (frequent updates allowed)
export const locationLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 location updates per second
  standardHeaders: true,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// API endpoint limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
});
