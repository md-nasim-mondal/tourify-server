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

// Get Reviews for a Listing (Public)
router.get("/:listingId", ReviewController.getReviewsByListing);

export const ReviewRoutes = router;