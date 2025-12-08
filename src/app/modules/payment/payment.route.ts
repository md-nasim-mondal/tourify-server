import express from "express";
import { PaymentController } from "./payment.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Tourist initiates Stripe payment
router.post(
  "/stripe/initiate",
  auth(UserRole.TOURIST),
  PaymentController.initiateStripePayment
);

// Tourist initiates SSLCommerz payment
router.post(
  "/sslcommerz/initiate",
  auth(UserRole.TOURIST),
  PaymentController.initiateSSLCommerzPayment
);

// Confirm Payment (Manual for demo)
router.post(
  "/confirm",
  auth(UserRole.TOURIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  PaymentController.confirmPayment
);

// Stripe Webhook (No auth needed - called by Stripe)
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.stripeWebhook
);

// SSLCommerz Success/Fail/Cancel endpoints
router.post("/sslcommerz-success", PaymentController.sslCommerzSuccess);
router.post("/sslcommerz-fail", PaymentController.sslCommerzFail);
router.post("/sslcommerz-cancel", PaymentController.sslCommerzCancel);

// Get Payment Status
router.get(
  "/:paymentId/status",
  auth(UserRole.TOURIST, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.GUIDE),
  PaymentController.getPaymentStatus
);

export const PaymentRoutes = router;