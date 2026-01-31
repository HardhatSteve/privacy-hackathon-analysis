export class ArciumError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ArciumError';
  }
}

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

export class TransactionError extends Error {
  constructor(message: string, public signature?: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};
