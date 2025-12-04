import { BookingStatus } from "@prisma/client";
import { z } from "zod";

const createBookingValidation = z.object({
  body: z.object({
    listingId: z.string({ error: "Listing ID is required" }),
    date: z.string({ error: "Date is required" }), // Frontend should send ISO Date string
  }),
});

const updateBookingStatusValidation = z.object({
  body: z.object({
    status: z.enum(
      [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.COMPLETED],
      { error: "Status is required" }
    ),
  }),
});

export const BookingValidation = {
  createBookingValidation,
  updateBookingStatusValidation,
};