import { UserRole, UserStatus, Gender } from "@prisma/client";
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

const updateMyProfileValidation = z.object({
  body: z.object({
    name: z.string().optional(),
    contactNo: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
    gender: z.enum([Gender.MALE, Gender.FEMALE]).optional(),
    // Guide specific fields
    expertise: z.array(z.string()).optional(),
    languagesSpoken: z.array(z.string()).optional(),
    dailyRate: z.number().optional(),
    // Tourist specific fields
    travelPreferences: z.array(z.string()).optional(),
  }),
});

const updateUserValidation = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    contactNo: z.string().optional(),
    address: z.string().optional(),
    role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST]).optional(),
    status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.DELETED, UserStatus.BLOCKED]).optional(),
    isVerified: z.boolean().optional(),
    photo: z.string().optional(),
    bio: z.string().optional(),
    gender: z.enum([Gender.MALE, Gender.FEMALE]).optional(),
    expertise: z.array(z.string()).optional(),
    languagesSpoken: z.array(z.string()).optional(),
    dailyRate: z.number().optional(),
    travelPreferences: z.array(z.string()).optional(),
  }),
});


export const UserValidation = {
  createAdminValidation,
  createGuideValidation,
  updateStatusValidation,
  updateRoleValidation,
  updateMyProfileValidation,
  updateUserValidation
};