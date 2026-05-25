export class NavaAstroError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'NAVA_ASTRO_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends NavaAstroError {
  constructor(message: string = 'Invalid input parameters') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends NavaAstroError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class RateLimitError extends NavaAstroError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class NotFoundError extends NavaAstroError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ApiError extends NavaAstroError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'API_ERROR');
  }
}
