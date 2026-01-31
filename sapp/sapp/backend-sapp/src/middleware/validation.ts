import type { Request, Response, NextFunction } from 'express';

// MARK: - Validation Types

interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'email' | 'handle' | 'uuid' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
  enum?: any[];
  items?: ValidationRule;  // For array validation
  properties?: Record<string, ValidationRule>;  // For object validation
}

interface ValidationSchema {
  body?: Record<string, ValidationRule>;
  query?: Record<string, ValidationRule>;
  params?: Record<string, ValidationRule>;
}

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// MARK: - Validation Patterns

const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  handle: /^[a-z0-9_]{3,20}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  solanaAddress: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,  // Base58 Solana address
};

// MARK: - Validation Functions

function validateValue(value: any, rule: ValidationRule, fieldName: string): ValidationError | null {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return {
      field: fieldName,
      message: rule.message || `${fieldName} is required`,
    };
  }

  // Skip validation if value is not provided and not required
  if (value === undefined || value === null || value === '') {
    return null;
  }

  // Type validation
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be a string`,
          value,
        };
      }

      // Length validation
      if (rule.min !== undefined && value.length < rule.min) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be at least ${rule.min} characters`,
          value,
        };
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be at most ${rule.max} characters`,
          value,
        };
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} format is invalid`,
          value,
        };
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be one of: ${rule.enum.join(', ')}`,
          value,
        };
      }
      break;

    case 'number':
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof numValue !== 'number' || isNaN(numValue)) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be a number`,
          value,
        };
      }

      if (rule.min !== undefined && numValue < rule.min) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be at least ${rule.min}`,
          value,
        };
      }
      if (rule.max !== undefined && numValue > rule.max) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be at most ${rule.max}`,
          value,
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be a boolean`,
          value,
        };
      }
      break;

    case 'email':
      if (typeof value !== 'string' || !patterns.email.test(value)) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be a valid email address`,
          value,
        };
      }
      break;

    case 'handle':
      if (typeof value !== 'string' || !patterns.handle.test(value)) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be 3-20 characters, lowercase letters, numbers, and underscores only`,
          value,
        };
      }
      break;

    case 'uuid':
      if (typeof value !== 'string' || !patterns.uuid.test(value)) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be a valid UUID`,
          value,
        };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be an array`,
          value,
        };
      }

      if (rule.min !== undefined && value.length < rule.min) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must have at least ${rule.min} items`,
          value,
        };
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must have at most ${rule.max} items`,
          value,
        };
      }

      // Validate array items
      if (rule.items) {
        for (let i = 0; i < value.length; i++) {
          const itemError = validateValue(value[i], rule.items, `${fieldName}[${i}]`);
          if (itemError) {
            return itemError;
          }
        }
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        return {
          field: fieldName,
          message: rule.message || `${fieldName} must be an object`,
          value,
        };
      }

      // Validate object properties
      if (rule.properties) {
        for (const [propName, propRule] of Object.entries(rule.properties)) {
          const propError = validateValue(value[propName], propRule, `${fieldName}.${propName}`);
          if (propError) {
            return propError;
          }
        }
      }
      break;
  }

  return null;
}

// MARK: - Validation Middleware Factory

export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];

    // Validate body
    if (schema.body) {
      for (const [fieldName, rule] of Object.entries(schema.body)) {
        const error = validateValue(req.body?.[fieldName], rule, fieldName);
        if (error) {
          errors.push(error);
        }
      }
    }

    // Validate query parameters
    if (schema.query) {
      for (const [fieldName, rule] of Object.entries(schema.query)) {
        const error = validateValue(req.query?.[fieldName], rule, fieldName);
        if (error) {
          errors.push(error);
        }
      }
    }

    // Validate URL parameters
    if (schema.params) {
      for (const [fieldName, rule] of Object.entries(schema.params)) {
        const error = validateValue(req.params?.[fieldName], rule, fieldName);
        if (error) {
          errors.push(error);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors[0].message,  // Return first error message for simplicity
        errors,
      });
    }

    next();
  };
}

// MARK: - Pre-defined Validation Schemas

export const schemas = {
  // Auth schemas
  register: {
    body: {
      email: { type: 'email' as const, required: true },
      handle: { type: 'handle' as const, required: true },
      displayName: { type: 'string' as const, required: false, min: 1, max: 50 },
      privyUserId: { type: 'string' as const, required: false },
    },
  },

  // User schemas
  userLookup: {
    query: {
      handle: { type: 'handle' as const, required: true },
    },
  },

  userSearch: {
    query: {
      q: { type: 'string' as const, required: true, min: 1, max: 50 },
      limit: { type: 'number' as const, required: false, min: 1, max: 20 },
    },
  },

  handleCheck: {
    query: {
      handle: { type: 'handle' as const, required: true },
    },
  },

  profileUpdate: {
    body: {
      email: { type: 'email' as const, required: true },
      displayName: { type: 'string' as const, required: false, min: 1, max: 50 },
    },
  },

  // Message schemas (for future WebSocket implementation)
  sendMessage: {
    body: {
      conversationId: { type: 'string' as const, required: true },
      content: { type: 'string' as const, required: true, min: 1, max: 10000 },
      replyTo: { type: 'string' as const, required: false },
    },
  },

  // Contact schemas
  blockUser: {
    body: {
      handle: { type: 'handle' as const, required: true },
    },
  },

  // Payment schemas (for Sapp integration)
  createPayment: {
    body: {
      recipientHandle: { type: 'handle' as const, required: true },
      amount: { type: 'number' as const, required: true, min: 0.000001 },
      token: { type: 'string' as const, required: false, enum: ['SOL', 'USDC', 'USDT'] },
      memo: { type: 'string' as const, required: false, max: 200 },
    },
  },
};

// MARK: - Helper Functions

/**
 * Sanitize string input (trim whitespace, normalize)
 */
export function sanitizeString(value: string | undefined): string | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }
  return value.trim();
}

/**
 * Sanitize handle (lowercase, trim)
 */
export function sanitizeHandle(value: string | undefined): string | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }
  return value.trim().toLowerCase();
}

/**
 * Sanitize email (lowercase, trim)
 */
export function sanitizeEmail(value: string | undefined): string | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }
  return value.trim().toLowerCase();
}

/**
 * Middleware to sanitize common fields in request body
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    if (req.body.email) {
      req.body.email = sanitizeEmail(req.body.email);
    }
    if (req.body.handle) {
      req.body.handle = sanitizeHandle(req.body.handle);
    }
    if (req.body.displayName) {
      req.body.displayName = sanitizeString(req.body.displayName);
    }
  }

  if (req.query) {
    if (req.query.email && typeof req.query.email === 'string') {
      req.query.email = sanitizeEmail(req.query.email);
    }
    if (req.query.handle && typeof req.query.handle === 'string') {
      req.query.handle = sanitizeHandle(req.query.handle);
    }
    if (req.query.q && typeof req.query.q === 'string') {
      req.query.q = sanitizeString(req.query.q);
    }
  }

  next();
}

export default {
  validate,
  schemas,
  sanitizeString,
  sanitizeHandle,
  sanitizeEmail,
  sanitizeRequest,
};
