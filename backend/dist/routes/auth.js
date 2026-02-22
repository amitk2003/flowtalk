"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pg_1 = require("../config/pg");
const User_1 = require("../models/User");
const BlacklistedToken_1 = require("../models/BlacklistedToken");
const tokens_1 = require("../utils/tokens");
const router = express_1.default.Router();
const userRepo = pg_1.AppDataSource.getRepository(User_1.User);
const blacklistRepo = pg_1.AppDataSource.getRepository(BlacklistedToken_1.BlacklistedToken);
// ✅ REGISTER
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser)
        return res.status(400).json({ message: "Email exists" });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = userRepo.create({ name, email, passwordHash });
    await userRepo.save(user);
    const accessToken = (0, tokens_1.generateAccessToken)(user.id, user.role);
    const refreshToken = (0, tokens_1.generateRefreshToken)(user.id);
    res.json({ accessToken, refreshToken });
});
// ✅ LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await userRepo.findOne({ where: { email } });
    if (!user)
        return res.status(400).json({ message: "Invalid credentials" });
    const match = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!match)
        return res.status(400).json({ message: "Invalid credentials" });
    const accessToken = (0, tokens_1.generateAccessToken)(user.id, user.role);
    const refreshToken = (0, tokens_1.generateRefreshToken)(user.id);
    res.json({ accessToken, refreshToken });
});
// ✅ REFRESH TOKEN
router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(401).json({ message: "No refresh token" });
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await userRepo.findOne({ where: { id: decoded.id } });
        if (!user)
            return res.status(401).json({ message: "User not found" });
        const accessToken = (0, tokens_1.generateAccessToken)(user.id, user.role);
        res.json({ accessToken });
    }
    catch {
        res.status(403).json({ message: "Invalid refresh token" });
    }
});
// ✅ LOGOUT (Blacklist Access Token)
router.post("/logout", async (req, res) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token)
        return res.sendStatus(400);
    const blacklisted = blacklistRepo.create({ token });
    await blacklistRepo.save(blacklisted);
    res.json({ message: "Logged out successfully" });
});
exports.default = router;
