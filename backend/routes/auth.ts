import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/pg"
import { User } from "../models/User";
import { BlacklistedToken } from "../models/BlacklistedToken";
import { generateAccessToken, generateRefreshToken } from "../utils/tokens";
import { RefreshToken } from "../models/RefreshToken";
const router = express.Router();
const userRepo = AppDataSource.getRepository(User);
const blacklistRepo = AppDataSource.getRepository(BlacklistedToken);
const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);


// ✅ REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await userRepo.findOne({ where: { email} });
  if (existingUser) return res.status(400).json({ message: "Username already exists" });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = userRepo.create({ name, email, passwordHash });
  const userdata=await userRepo.save(user);

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  res.json({ accessToken, refreshToken,user:{id:userdata.id,name:userdata.name,email:userdata.email} });
});


// ✅ LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;





  const user = await userRepo.findOne({ where: { email } });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

const refreshTokenEntity = refreshTokenRepo.create({
  token: refreshToken,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  user: user,
});
  await refreshTokenRepo.save(refreshTokenEntity)
  res.json({ accessToken, refreshToken });
});


// ✅ REFRESH TOKEN
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as any;

    const tokenInDb = await refreshTokenRepo.findOne({
      where: { token: refreshToken },
      relations: ["user"],
    });

    if (!tokenInDb) {
      return res.status(403).json({ message: "Refresh token revoked" });
    }

    if (tokenInDb.expiresAt < new Date()) {
      return res.status(403).json({ message: "Refresh token expired" });
    }

    const newAccessToken = generateAccessToken(
      tokenInDb.user.id,
      tokenInDb.user.role
    );

    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

// ✅ LOGOUT (Blacklist Access Token)
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  const accessToken = req.header("Authorization")?.replace("Bearer ", "");

  if (!refreshToken || !accessToken)
    return res.status(400).json({ message: "Missing tokens" });

  // Blacklist access token
  await blacklistRepo.save({ token: accessToken });

  // Remove refresh token
  await refreshTokenRepo.delete({ token: refreshToken });

  res.json({ message: "Logged out successfully" });
});

export default router;
