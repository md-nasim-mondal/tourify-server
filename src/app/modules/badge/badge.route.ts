import express from 'express';
import { BadgeController } from './badge.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import { BadgeValidation } from './badge.validation';

const router = express.Router();

// Admin can create a new badge definition
router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(BadgeValidation.createBadge),
  BadgeController.createBadge
);

// Admin can assign a badge to a user
router.post(
  '/assign-to-user',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(BadgeValidation.assignBadgeToUser),
  BadgeController.assignBadgeToUser
);

// Admin can revoke a badge from a user
router.delete(
  '/revoke-from-user',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(BadgeValidation.revokeBadgeFromUser),
  BadgeController.revokeBadgeFromUser
);

// Get all badge definitions (Public)
router.get(
  '/',
  BadgeController.getAllBadges
);

// Get a single badge definition (Public)
router.get(
  '/:id',
  BadgeController.getSingleBadge
);

// Admin can update a badge definition
router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(BadgeValidation.updateBadge),
  BadgeController.updateBadge
);

// Admin can delete a badge definition
router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  BadgeController.deleteBadge
);

export const BadgeRoutes = router;
