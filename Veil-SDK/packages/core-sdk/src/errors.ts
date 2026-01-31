export class VeilError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VeilError';
  }
}

export class NotImplementedError extends VeilError {
  constructor(methodName: string) {
    super(`Method '${methodName}' is not yet implemented.`);
    this.name = 'NotImplementedError';
  }
}

export class ConfigurationError extends VeilError {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends VeilError {
  constructor(message: string) {
    super(`Validation Error: ${message}`);
    this.name = 'ValidationError';
  }
}
