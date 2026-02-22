import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn ,OneToMany } from "typeorm";
import { RefreshToken } from "./RefreshToken";
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;
  @Column({default:"user"})
  role!:"user" | "admin"

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  lastSeen?: Date;

  @Column({ default: false })
  isOnline!: boolean;
  
  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
refreshTokens!: RefreshToken[];
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
