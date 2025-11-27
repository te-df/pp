/**
 * AppError.gs
 * Custom error class for the application.
 */

// Códigos de Status HTTP
var HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
};

/**
 * Tipos de erro do sistema
 */
var ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  NOT_FOUND: 'NotFoundError',
  PERMISSION: 'PermissionError',
  NETWORK: 'NetworkError',
  DATABASE: 'DatabaseError',
  TIMEOUT: 'TimeoutError',
  UNKNOWN: 'UnknownError'
};

/**
 * Classe de erro customizado
 */
class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, statusCode = 500, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.stack = new Error().stack;
  }
  
  toJSON() {
    return {
      success: false,
      error: this.message,
      type: this.type,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}
