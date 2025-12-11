import { z } from "zod";

const createAvailability = z.object({
  body: z.object({
    date: z
      .string({
        error: "Date is required",
      })
      .datetime(),
    startTime: z
      .string({
        error: "Start time is required",
      })
      .datetime(),
    endTime: z
      .string({
        error: "End time is required",
      })
      .datetime(),
    isAvailable: z.boolean().optional(),
  }),
});

const updateAvailability = z.object({
  body: z.object({
    date: z.string().datetime().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const AvailabilityValidation = {
  createAvailability,
  updateAvailability,
};
