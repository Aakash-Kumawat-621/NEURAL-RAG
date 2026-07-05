// Custom error classes for structured error handling across the application

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests. Please try again later.") {
    super(message, "RATE_LIMIT_ERROR", 429);
    this.name = "RateLimitError";
  }
}

export class FileSizeError extends AppError {
  constructor(maxSizeMB: number) {
    super(
      `File exceeds the maximum size of ${maxSizeMB}MB`,
      "FILE_SIZE_ERROR",
      413
    );
    this.name = "FileSizeError";
  }
}

export class FileTypeError extends AppError {
  constructor(supportedTypes: readonly string[]) {
    super(
      `Unsupported file type. Supported formats: ${supportedTypes.join(", ")}`,
      "FILE_TYPE_ERROR",
      415
    );
    this.name = "FileTypeError";
  }
}

export class PipelineError extends AppError {
  constructor(step: string, message: string) {
    super(
      `Pipeline error at step "${step}": ${message}`,
      "PIPELINE_ERROR",
      500
    );
    this.name = "PipelineError";
  }
}

// Utility to create a structured JSON error response
export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("Unhandled error:", error);
  return Response.json(
    { error: "An unexpected error occurred", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
