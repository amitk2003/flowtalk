import express from "express";
import { register, login, refresh, logout, getMe } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from "../schemas/auth.schema";
import { authLimiter } from "../middleware/rateLimiter";
import { auth } from "../middleware/auth";

const router = express.Router();

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", validate(logoutSchema), logout);
router.get("/me", auth, getMe);

export default router;
