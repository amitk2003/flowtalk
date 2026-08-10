import morgan from "morgan";
import { env } from "../config/env";

/**
 * HTTP request logger.
 * Uses "dev" format in development (colorized), "combined" in production.
 */
export const requestLogger = morgan(
  env.NODE_ENV === "production" ? "combined" : "dev"
);
