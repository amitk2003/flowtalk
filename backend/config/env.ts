/**
 * Centralized, typed environment configuration.
 * Throws at startup if any required variable is missing.
 */

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return val;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] || fallback;

export const env = {
  PORT: Number(optional("PORT", "5000")),
  CLIENT_URL: optional("CLIENT_URL", "http://localhost:3000"),
  DATABASE_URL: required("DATABASE_URL"),
  ACCESS_TOKEN_SECRET: required("ACCESS_TOKEN_SECRET"),
  REFRESH_TOKEN_SECRET: required("REFRESH_TOKEN_SECRET"),
  JWT_SECRET: optional("JWT_SECRET", "fallback_secret"),
  GROQ_API_KEY: required("GROQ_API_KEY"),
  NODE_ENV: optional("NODE_ENV", "development"),
} as const;
