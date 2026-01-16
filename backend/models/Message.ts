import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export type MessageStatus = "sent" | "delivered" | "read";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  room!: string;

  @Column()
  senderId!: string;

  @Column({ nullable: true })
  text?: string;

  @Column({ nullable: true })
  media?: string;

  // ✅ FIX: Use plain string column + enum constraint instead of TS union
  @Column({
    type: "varchar",
    default: "sent",
  })
  status!: MessageStatus;

  // ✅ FIX: Proper default for Postgres UUID array
  @Column("uuid", {
    array: true,
    default: () => "ARRAY[]::uuid[]",
  })
  readBy!: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
