import express from "express";
import { ReviewController } from "./review.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { ReviewValidation } from "./review.validation";

const router = express.Router();

// Create Review (Only Tourist)
router.post(
  "/",
  auth(UserRole.TOURIST),
  validateRequest(ReviewValidation.createReviewValidation),
  ReviewController.createReview
);

// Get All Reviews (Admin / Super Admin)
router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  ReviewController.getAllReviews
);

// Get Single Review
router.get(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  ReviewController.getSingleReview
);

// Get Reviews for a Listing (Public - no auth needed)
router.get("/listing/:listingId", ReviewController.getReviewsByListing);

// Get My Reviews (Tourist)
router.get(
  "/my",
  auth(UserRole.TOURIST),
  ReviewController.getMyReviews
);

// Update Review
router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TOURIST), // Tourist can update their own, Admin/Super Admin can update all
  validateRequest(ReviewValidation.updateReviewValidation),
  ReviewController.updateReview
);

// Delete Review
router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TOURIST), // Tourist can delete their own, Admin/Super Admin can delete all
  ReviewController.deleteReview
);

export const ReviewRoutes = router;
