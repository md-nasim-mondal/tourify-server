import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

const createAdminValidation = z.object({
  password: z.string().min(6),
  admin: z.object({
    name: z.string(),
    email: z.string().email(),
    contactNo: z.string(),
  }),
});

const createGuideValidation = z.object({
  password: z.string().min(6),
  guide: z.object({
    name: z.string(),
    email: z.string().email(),
    contactNo: z.string(),
    bio: z.string().optional(),
    address: z.string().optional(),
  }),
});

const updateStatusValidation = z.object({
  body: z.object({
    status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]),
  }),
});

const updateRoleValidation = z.object({
  body: z.object({
    role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST]),
  }),
});

export const UserValidation = {
  createAdminValidation,
  createGuideValidation,
  updateStatusValidation,
  updateRoleValidation,
};