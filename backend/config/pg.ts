import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.PG_HOST || "localhost",
  port: Number(process.env.PG_PORT) || 5432,
  username: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: process.env.PG_DB || "chat_app",
  synchronize: true,   // auto-create tables (use false in production)
  logging: false,
  entities: ["src/models/*.ts"],
});

export const connectDB = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ PostgreSQL connected");
  } catch (err) {
    console.error("PostgreSQL connection error:", err);
  }
};
