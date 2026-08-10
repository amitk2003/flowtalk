import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",

  // Neon serverless PostgreSQL connection
  url: process.env.DATABASE_URL,

  // Neon requires SSL
  ssl: {
    rejectUnauthorized: false,
  },

  // NOTE: Set to false in production — use migrations instead
  synchronize: true,
  logging: process.env.NODE_ENV === "development",

  entities: [__dirname + "/../models/*.{ts,js}"],
});

export const connectDB = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to Neon PostgreSQL");
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err);
    process.exit(1); // Fatal: cannot run without a database
  }
};
