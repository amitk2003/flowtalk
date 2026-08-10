import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for auth endpoints (prevent brute-force).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter for all /api routes.
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  message: { success: false, message: "Rate limit exceeded. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
