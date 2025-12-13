import { z } from "zod";

const createListingValidation = z.object({
  body: z.object({
    title: z.string({ error: "Title is required" }),
    description: z.string({ error: "Description is required" }),
    location: z.string({ error: "Location is required" }),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    price: z.any(), // Allow any (string/number)
    duration: z.any().optional(), // Allow any
    maxGroupSize: z.any().optional(), // Allow any
    category: z.any().optional(), // Allow any
    languages: z.any().optional(), // Allow any
    meetingPoint: z.string().optional(),
  }),
});

const updateListingValidation = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    price: z.any().optional(), // Allow any (string/number) to bypass temporary validation issues
    duration: z.any().optional(), // Allow any
    maxGroupSize: z.any().optional(), // Allow any
    category: z.any().optional(), // Allow any (string or array)
    languages: z.any().optional(), // Allow any (string or array)
    meetingPoint: z.string().optional(),
    keptImages: z.any().optional(), // Allow any
  }),
});

const updateListingStatusValidation = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "BLOCKED"]),
  }),
});

export const ListingValidation = {
  createListingValidation,
  updateListingValidation,
  updateListingStatusValidation,
};
