import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  token!: string;

  @Column()
  expiresAt!: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: "CASCADE",
  })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}