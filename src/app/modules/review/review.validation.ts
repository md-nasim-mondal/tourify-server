import { z } from "zod";

const createReviewValidation = z.object({
  body: z.object({
    listingId: z.string({ error: "Listing ID is required" }),
    rating: z.number().min(1).max(5),
    comment: z.string({ error: "Comment is required" }),
  }),
});

export const ReviewValidation = {
  createReviewValidation,
};
