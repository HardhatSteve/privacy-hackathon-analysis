import type { NextFunction, Request, Response } from 'express';

// Not-found handler
export function notFoundHandler(_req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
}

// Centralized error handler
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[sapp-backend] Unhandled error:', err);

  const message = err instanceof Error ? err.message : 'Internal server error';

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message,
  });
}
