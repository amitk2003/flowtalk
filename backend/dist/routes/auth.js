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
const RefreshToken_1 = require("../models/RefreshToken");
const router = express_1.default.Router();
const userRepo = pg_1.AppDataSource.getRepository(User_1.User);
const blacklistRepo = pg_1.AppDataSource.getRepository(BlacklistedToken_1.BlacklistedToken);
const refreshTokenRepo = pg_1.AppDataSource.getRepository(RefreshToken_1.RefreshToken);
// ✅ REGISTER
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser)
        return res.status(400).json({ message: "User with this email already exists" });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = userRepo.create({ name, email, passwordHash });
    await userRepo.save(user);
    const accessToken = (0, tokens_1.generateAccessToken)(user.id, user.role);
    const refreshToken = (0, tokens_1.generateRefreshToken)(user.id);
    res.status(201).json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email } });
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
    const refreshTokenEntity = refreshTokenRepo.create({
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: user,
    });
    await refreshTokenRepo.save(refreshTokenEntity);
    res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email }
    });
});
// ✅ REFRESH TOKEN
router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(401).json({ message: "No refresh token" });
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
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
        const newAccessToken = (0, tokens_1.generateAccessToken)(tokenInDb.user.id, tokenInDb.user.role);
        res.json({ accessToken: newAccessToken });
    }
    catch {
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
exports.default = router;
