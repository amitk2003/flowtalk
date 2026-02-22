"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    // 👇 Neon connection (THIS is the key change)
    url: process.env.Database_URL,
    // 👇 Neon requires SSL
    ssl: {
        rejectUnauthorized: false,
    },
    synchronize: true, // dev only (disable in prod)
    logging: false,
    // 👇 safer entity path for TS + compiled JS
    entities: [__dirname + "/../models/*.{ts,js}"],
});
const connectDB = async () => {
    try {
        await exports.AppDataSource.initialize();
        console.log("✅ Connected to Neon PostgreSQL");
    }
    catch (err) {
        console.error("❌ PostgreSQL connection error:", err);
    }
};
exports.connectDB = connectDB;
