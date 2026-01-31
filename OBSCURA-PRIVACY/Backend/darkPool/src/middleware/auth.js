import config from '../config/index.js';

export const authenticateApiKey = (req, res, next) => {
  // Skip authentication if no API key is configured
  if (!config.security.apiKey) {
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required. Include X-API-Key header.'
    });
  }

  if (apiKey !== config.security.apiKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
};

// Rate limiting middleware
const rateLimitStore = new Map();

export const rateLimit = (req, res, next) => {
  const identifier = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = config.security.rateLimitWindowMs;
  const maxRequests = config.security.rateLimitMaxRequests;

  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, []);
  }

  const requests = rateLimitStore.get(identifier);
  const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);

  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.'
    });
  }

  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);

  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, validTimestamps);
      }
    }
  }

  next();
};

export default { authenticateApiKey, rateLimit };
