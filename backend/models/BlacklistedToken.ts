import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("blacklisted_tokens")
export class BlacklistedToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  token!: string;

  @CreateDateColumn()
  blacklistedAt!: Date;
}
