import { z } from "zod";

const createListingValidation = z.object({
  body: z.object({
    title: z.string({ error: "Title is required" }),
    description: z.string({ error: "Description is required" }),
    location: z.string({ error: "Location is required" }),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    price: z.number({ error: "Price is required" }).positive(),
    duration: z.string().optional(),
    maxGroupSize: z.number().int().positive().optional(),
    category: z.string().optional(),
    languages: z.array(z.string()).optional(),
    meetingPoint: z.string().optional(),
    // Images will be handled via Multer, validation checks if array is present
  }),
});

const updateListingValidation = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    price: z.number().positive().optional(),
    duration: z.string().optional(),
    maxGroupSize: z.number().int().positive().optional(),
    category: z.string().optional(),
    languages: z.array(z.string()).optional(),
    meetingPoint: z.string().optional(),
  }),
});

export const ListingValidation = {
  createListingValidation,
  updateListingValidation,
};
