import { z } from "zod";
import { emailSchema, passwordSchema } from "./auth";

export const roleEnum = z.enum(["OWNER", "ADMIN", "COORDINATOR"]);

export const addMemberSchema = z.object({
  email: emailSchema,
  name: z.string().min(2, "Минимум 2 символа").max(100),
  password: passwordSchema,
  role: roleEnum,
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const changeRoleSchema = z.object({
  memberId: z.string().min(1),
  role: roleEnum,
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
