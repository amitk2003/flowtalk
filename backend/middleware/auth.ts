import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/pg";
import { User } from "../models/User";
import { BlacklistedToken } from "../models/BlacklistedToken";

export interface AuthRequest extends Request {
  user?: User;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ success: false, message: "No token provided" });

  const blacklistRepo = AppDataSource.getRepository(BlacklistedToken);
  const userRepo = AppDataSource.getRepository(User);

  const blacklisted = await blacklistRepo.findOne({ where: { token } });
  if (blacklisted) return res.status(401).json({ success: false, message: "Token has been revoked" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    const user = await userRepo.findOne({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};