import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export type MessageStatus = "sent" | "delivered" | "read";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  roomId!: string;

  @Column("uuid")
  senderId!: string;

  @Column({ nullable: true })
  content?: string;

  @Column({ nullable: true })
  mediaUrl?: string;

  @Column({
    type: "varchar",
    default: "sent",
  })
  deliveryStatus!: MessageStatus;

  @Column("uuid", {
    array: true,
    default: () => "ARRAY[]::uuid[]",
  })
  readByUserIds!: string[];

  @CreateDateColumn()
  createdAt!: Date;
}