import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { ApiError } from '../types';

/**
 * API Key authentication middleware
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== config.apiToken) {
    const error: ApiError = {
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(error);
  }

  next();
};

/**
 * Rate limiting middleware
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded, please try again later',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const error: ApiError = {
      error: 'Validation Error',
      message: 'Invalid request data',
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(error);
  }

  // Handle Google Sheets API errors
  if (err.message.includes('Unable to parse range')) {
    const error: ApiError = {
      error: 'Sheets Error',
      message: 'Invalid sheet range or named range not found',
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(error);
  }

  // Handle authentication errors
  if (err.message.includes('authentication') || err.message.includes('permission')) {
    const error: ApiError = {
      error: 'Authentication Error',
      message: 'Failed to authenticate with Google Sheets',
      timestamp: new Date().toISOString(),
    };
    return res.status(500).json(error);
  }

  // Generic error response
  const error: ApiError = {
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(error);
};

/**
 * 404 handler middleware
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const error: ApiError = {
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(error);
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};