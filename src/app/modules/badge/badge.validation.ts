import { z } from 'zod';

const createBadge = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    icon: z.string().url().optional(),
    criteria: z.string().optional(),
  }),
});

const assignBadgeToUser = z.object({
  body: z.object({
    userId: z.string().uuid(),
    badgeId: z.string().uuid(),
  }),
});

const revokeBadgeFromUser = z.object({
  body: z.object({
    userId: z.string().uuid(),
    badgeId: z.string().uuid(),
  }),
});

const updateBadge = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    icon: z.string().url().optional(),
    criteria: z.string().optional(),
  }),
});

export const BadgeValidation = {
  createBadge,
  assignBadgeToUser,
  revokeBadgeFromUser,
  updateBadge,
};

