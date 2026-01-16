import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("rooms")
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ default: false })
  isPrivate!: boolean;

  @Column("uuid", { array: true })
  members!: string[];

  @Column({ nullable: true })
  lastMessage?: string;

  @Column({ nullable: true })
  lastMessageAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
