import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Validate request body against a Zod schema (Zod v4 compatible).
 * Returns 422 with detailed field errors if validation fails.
 */
export const validate =
  (schema: ZodSchema) =>
    (req: Request, res: Response, next: NextFunction) => {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        // Zod v4 uses .issues, Zod v3 uses .errors — handle both safely
        const issues: any[] = (result.error as any).issues ?? (result.error as any).errors ?? [];
        const errors = issues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join(".") : String(e.path ?? ""),
          message: e.message,
        }));

        return res.status(422).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      req.body = result.data;
      next();
    };
