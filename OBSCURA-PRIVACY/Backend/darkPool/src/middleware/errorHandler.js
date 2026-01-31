import config from '../config/index.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error'
  };

  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json(errorResponse);
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(errorResponse);
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json(errorResponse);
  }

  // Default to 500 Internal Server Error
  res.status(err.statusCode || 500).json(errorResponse);
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default { errorHandler, asyncHandler };
