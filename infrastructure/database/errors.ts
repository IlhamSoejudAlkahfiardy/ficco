/**
 * Database Error Handling Architecture
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Section 27)
 */

export class DatabaseError extends Error {
  public readonly code: string;
  public readonly originalError?: unknown;

  constructor(message: string, code = 'DB_ERROR', originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.originalError = originalError;
  }
}

export class NotFoundError extends DatabaseError {
  constructor(entityName: string, id: string | number) {
    super(`${entityName} with id "${id}" was not found.`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class DuplicateKeyError extends DatabaseError {
  constructor(field: string, value: string) {
    super(`A record with ${field} "${value}" already exists.`, 'DUPLICATE_KEY');
    this.name = 'DuplicateKeyError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Normalizes Dexie/IndexedDB exceptions into standard application DatabaseErrors
 */
export function handleDbError(error: unknown, context: string): never {
  if (error instanceof DatabaseError) {
    throw error;
  }

  const err = error as Error & { name?: string; inner?: unknown };
  const message = err?.message || 'An unknown database error occurred.';

  if (err?.name === 'ConstraintError') {
    throw new DuplicateKeyError(context, message);
  }

  if (err?.name === 'NotFoundError') {
    throw new NotFoundError(context, 'unknown');
  }

  throw new DatabaseError(
    `Database error in ${context}: ${message}`,
    'INDEXEDDB_ERROR',
    error
  );
}
