import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
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
  entities: [__dirname + "/../models/*.{ts,js}"],  // folder location for models
});

export const connectDB = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to Neon PostgreSQL");
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err);
  }
};
