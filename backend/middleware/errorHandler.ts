import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export interface AppError extends Error {
  statusCode?: number;
}

/**
 * Global Express error handler.
 * Catches all errors thrown via next(err) or thrown in async route handlers.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${req.method} ${req.url} → ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * Wraps async route handlers so errors are forwarded to errorHandler automatically.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
