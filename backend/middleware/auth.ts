import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/pg";
import { User } from "../models/User";
import { BlacklistedToken } from "../models/BlacklistedToken";

export interface AuthRequest extends Request {
  user?: User;
}

const userRepo = AppDataSource.getRepository(User);
const blacklistRepo = AppDataSource.getRepository(BlacklistedToken);

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token" });

  const blacklisted = await blacklistRepo.findOne({ where: { token } });
  if (blacklisted) return res.status(401).json({ message: "Token blacklisted" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;

    const user = await userRepo.findOne({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
console.log("ACCESS_SECRET:", process.env.ACCESS_TOKEN_SECRET);