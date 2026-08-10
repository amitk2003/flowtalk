import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/pg";
import { User } from "../models/User";
import { BlacklistedToken } from "../models/BlacklistedToken";
import { RefreshToken } from "../models/RefreshToken";
import { generateAccessToken, generateRefreshToken } from "../utils/tokens";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const userRepo = () => AppDataSource.getRepository(User);
const blacklistRepo = () => AppDataSource.getRepository(BlacklistedToken);
const refreshTokenRepo = () => AppDataSource.getRepository(RefreshToken);

// ─── REGISTER ──────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await userRepo().findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = userRepo().create({ name, email, passwordHash });
  await userRepo().save(user);

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // Persist refresh token
  const rtEntity = refreshTokenRepo().create({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    user,
  });
  await refreshTokenRepo().save(rtEntity);

  res.status(201).json({
    success: true,
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
  });
});

// ─── LOGIN ─────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const user = await userRepo().findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  const rtEntity = refreshTokenRepo().create({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    user,
  });
  await refreshTokenRepo().save(rtEntity);

  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
  });
});

// ─── REFRESH TOKEN ─────────────────────────────────────────────────────────
export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "No refresh token provided" });
  }

  try {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!);
  } catch {
    return res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
  }

  const tokenInDb = await refreshTokenRepo().findOne({
    where: { token: refreshToken },
    relations: ["user"],
  });

  if (!tokenInDb) {
    return res.status(403).json({ success: false, message: "Refresh token has been revoked" });
  }

  if (tokenInDb.expiresAt < new Date()) {
    await refreshTokenRepo().delete({ token: refreshToken });
    return res.status(403).json({ success: false, message: "Refresh token expired" });
  }

  const newAccessToken = generateAccessToken(tokenInDb.user.id, tokenInDb.user.role);
  res.json({ success: true, accessToken: newAccessToken });
});

// ─── LOGOUT ────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  const accessToken = req.header("Authorization")?.replace("Bearer ", "");

  if (!refreshToken || !accessToken) {
    return res.status(400).json({ success: false, message: "Missing tokens" });
  }

  await blacklistRepo().save({ token: accessToken });
  await refreshTokenRepo().delete({ token: refreshToken });

  res.json({ success: true, message: "Logged out successfully" });
});

// ─── GET ME ────────────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, isOnline: user.isOnline },
  });
});
