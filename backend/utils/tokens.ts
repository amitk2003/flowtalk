import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign(
    { id: userId, role, type: "access" },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { id: userId, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d" }
  );
};