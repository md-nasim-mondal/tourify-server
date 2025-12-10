import { z } from "zod";

const loginValidation = z.object({
  body: z.object({
    email: z.email({ error: "Email is required" }),
    password: z.string({ error: "Password is required" }),
  }),
});

const registerValidation = z.object({
  body: z.object({
    name: z.string({ error: "Name is required" }),
    email: z.string({ error: "Email is required" }).email(),
    password: z.string({ error: "Password is required" }).min(6),
    contactNo: z.string().optional(),
    address: z.string().optional(),
    role: z.enum(["TOURIST", "GUIDE"]).default("TOURIST"), // Ensure role is always provided or defaults
    expertise: z.string().optional(), // Frontend sends comma-separated string
    dailyRate: z.coerce.number().optional(), // Frontend sends number string
    languagesSpoken: z.string().optional(), // Frontend sends comma-separated string
    bio: z.string().optional(),
  }),
});

const refreshTokenValidation = z.object({
  cookies: z.object({
    refreshToken: z.string({ error: "Refresh token is required" }),
  }),
});

const changePasswordValidation = z.object({
  body: z.object({
    oldPassword: z.string({ error: "Old Password is required" }),
    newPassword: z.string({ error: "New Password is required" }),
  }),
});

const verifyEmailValidation = z.object({
  body: z.object({
    token: z.string({ error: "Verification token is required" }),
  }),
});

export const AuthValidation = {
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  changePasswordValidation,
  verifyEmailValidation,
};
