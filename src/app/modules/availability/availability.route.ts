import express from "express";
import { AvailabilityController } from "./availability.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { AvailabilityValidation } from "./availability.validation";

const router = express.Router();

// Guide can create availability slots
router.post(
  "/",
  auth(UserRole.GUIDE),
  validateRequest(AvailabilityValidation.createAvailability),
  AvailabilityController.createAvailability
);

// Guide can get their own availability slots
router.get(
  "/my-availability",
  auth(UserRole.GUIDE),
  AvailabilityController.getMyAvailability
);

// Get all availability slots (admin/super_admin) or for a specific guide (public)
router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST), // Can be accessed by anyone but filtered by guideId for public
  AvailabilityController.getAllAvailabilities
);

// Get a single availability slot
router.get("/:id", AvailabilityController.getSingleAvailability);

// Guide can update their availability slot
router.patch(
  "/:id",
  auth(UserRole.GUIDE),
  validateRequest(AvailabilityValidation.updateAvailability),
  AvailabilityController.updateAvailability
);

// Guide can delete their availability slot
router.delete(
  "/:id",
  auth(UserRole.GUIDE),
  AvailabilityController.deleteAvailability
);

export const AvailabilityRoutes = router;
