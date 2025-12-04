import express from "express";
import { BookingController } from "./booking.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { BookingValidation } from "./booking.validation";

const router = express.Router();

// Create Booking (Only Tourist)
router.post(
  "/",
  auth(UserRole.TOURIST),
  validateRequest(BookingValidation.createBookingValidation),
  BookingController.createBooking
);

// Get All Bookings (Admin sees all, Guide sees theirs, Tourist sees theirs)
router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  BookingController.getAllBookings
);

// Get Single Booking
router.get(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  BookingController.getSingleBooking
);

// Update Status (Guide Accepts/Rejects, Tourist Cancels, Admin Manages)
router.patch(
  "/:id/status",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  validateRequest(BookingValidation.updateBookingStatusValidation),
  BookingController.updateBookingStatus
);

export const BookingRoutes = router;