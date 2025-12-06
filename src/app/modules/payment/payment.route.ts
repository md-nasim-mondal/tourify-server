import express from "express";
import { PaymentController } from "./payment.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Tourist initiates payment
router.post(
  "/initiate",
  auth(UserRole.TOURIST),
  PaymentController.initiatePayment
);

// Confirm Payment (Usually handled by Gateway Webhook, here manually for assignment)
router.post(
  "/confirm",
  auth(UserRole.TOURIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  PaymentController.confirmPayment
);

export const PaymentRoutes = router;
