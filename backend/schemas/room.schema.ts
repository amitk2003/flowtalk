import { z } from "zod";

export const createPrivateRoomSchema = z.object({
  otherUserId: z
    .string()
    .uuid("otherUserId must be a valid UUID"),
});

export type CreatePrivateRoomInput = z.infer<typeof createPrivateRoomSchema>;
