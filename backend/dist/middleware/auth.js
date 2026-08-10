"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pg_1 = require("../config/pg");
const User_1 = require("../models/User");
const BlacklistedToken_1 = require("../models/BlacklistedToken");
const userRepo = pg_1.AppDataSource.getRepository(User_1.User);
const blacklistRepo = pg_1.AppDataSource.getRepository(BlacklistedToken_1.BlacklistedToken);
const auth = async (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token)
        return res.status(401).json({ message: "No token" });
    const blacklisted = await blacklistRepo.findOne({ where: { token } });
    if (blacklisted)
        return res.status(401).json({ message: "Token blacklisted" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await userRepo.findOne({ where: { id: decoded.id } });
        if (!user)
            return res.status(401).json({ message: "User not found" });
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid token" });
    }
};
exports.auth = auth;
console.log("ACCESS_SECRET:", process.env.ACCESS_TOKEN_SECRET);
