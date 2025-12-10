import { z } from "zod";

const createReviewValidation = z.object({
  body: z.object({
    listingId: z.string({ error: "Listing ID is required" }),
    rating: z.number().min(1).max(5),
    comment: z.string({ error: "Comment is required" }),
  }),
});

const updateReviewValidation = z.object({
  body: z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
  }),
});

export const ReviewValidation = {
  createReviewValidation,
  updateReviewValidation,
};
