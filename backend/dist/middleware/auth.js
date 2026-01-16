"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
// Middleware function
const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Assuming your JWT contains { id: string }
        req.user = await User_1.default.findById(decoded.id).select('-passwordHash');
        if (!req.user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Token invalid or expired' });
    }
};
exports.default = auth;
