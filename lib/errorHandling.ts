/**
 * Logging and Error Handling Utilities
 * Provides consistent logging across the application
 */

enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Logger utility for consistent logging
 * Logs to console and can be extended to send to logging service
 */
class Logger {
  private module: string;
  private isDevelopment: boolean;

  constructor(module: string) {
    this.module = module;
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  private formatLog(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message}`;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      data,
    };
  }

  debug(message: string, data?: Record<string, any>) {
    if (!this.isDevelopment) return;

    const entry = this.createEntry(LogLevel.DEBUG, message, data);
    console.debug(this.formatLog(entry), data);
  }

  info(message: string, data?: Record<string, any>) {
    const entry = this.createEntry(LogLevel.INFO, message, data);
    console.info(this.formatLog(entry), data);
  }

  warn(message: string, data?: Record<string, any>) {
    const entry = this.createEntry(LogLevel.WARN, message, data);
    console.warn(this.formatLog(entry), data);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, any>) {
    const entry = this.createEntry(LogLevel.ERROR, message, data);
    const errorInfo =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;

    console.error(this.formatLog(entry), errorInfo, data);
  }
}

/**
 * Create logger instance for a specific module
 */
export function createLogger(module: string): Logger {
  return new Logger(module);
}

/**
 * Custom error classes for better error handling
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public context?: Record<string, any>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super("VALIDATION_ERROR", message, 400, context);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, any>) {
    super("NOT_FOUND", `${resource} not found`, 404, context);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", context?: Record<string, any>) {
    super("UNAUTHORIZED", message, 401, context);
    this.name = "UnauthorizedError";
  }
}

export class FirebaseError extends AppError {
  constructor(
    public originalError: any,
    context?: Record<string, any>,
  ) {
    super(
      "FIREBASE_ERROR",
      originalError?.message || "Firebase operation failed",
      500,
      context,
    );
    this.name = "FirebaseError";
  }
}

export class OneSignalError extends AppError {
  constructor(
    public originalError: any,
    context?: Record<string, any>,
  ) {
    super(
      "ONESIGNAL_ERROR",
      originalError?.message || "OneSignal operation failed",
      500,
      context,
    );
    this.name = "OneSignalError";
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safe async operation wrapper
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: any) => T,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      return errorHandler(error);
    }
    console.error("[safeAsync] Error:", error);
    return undefined;
  }
}

/**
 * Retry logic for failed operations
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[retryAsync] Attempt ${attempt} failed:`,
        lastError.message,
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Input validation utilities
 */
export const validators = {
  isValidUSN(usn: string): boolean {
    return typeof usn === "string" && usn.length > 0 && usn.trim().length > 0;
  },

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidAttendanceType(type: string): boolean {
    return type === "ENTRY" || type === "EXIT";
  },

  isValidTimestamp(timestamp: unknown): boolean {
    if (timestamp instanceof Date) return !isNaN(timestamp.getTime());
    if (typeof timestamp === "string") {
      return !isNaN(new Date(timestamp).getTime());
    }
    return false;
  },
};

/**
 * Performance monitoring helper
 */
export class PerformanceMonitor {
  private startTime: number;
  private logger: Logger;

  constructor(
    private operationName: string,
    module: string = "PerformanceMonitor",
  ) {
    this.logger = createLogger(module);
    this.startTime = Date.now();
  }

  end() {
    const duration = Date.now() - this.startTime;
    this.logger.debug(`${this.operationName} completed in ${duration}ms`, {
      operation: this.operationName,
      duration,
    });
    return duration;
  }
}
