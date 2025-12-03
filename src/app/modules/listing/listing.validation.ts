import { z } from "zod";

const createListingValidation = z.object({
  body: z.object({
    title: z.string({ error: "Title is required" }),
    description: z.string({ error: "Description is required" }),
    location: z.string({ error: "Location is required" }),
    price: z.number({ error: "Price is required" }).positive(),
    // Images will be handled via Multer, validation checks if array is present
  }),
});

const updateListingValidation = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    price: z.number().positive().optional(),
  }),
});

export const ListingValidation = {
  createListingValidation,
  updateListingValidation,
};
