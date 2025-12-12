/* eslint-disable no-console */
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PaymentService } from "./payment.service";
import { IAuthUser } from "../../interfaces/common";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

const initiateStripePayment = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { bookingId } = req.body;
    const result = await PaymentService.initiateStripePayment(bookingId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Stripe payment initiated successfully!",
      data: result,
    });
  }
);

const initiateSSLCommerzPayment = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { bookingId } = req.body;
    const result = await PaymentService.initiateSSLCommerzPayment(bookingId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "SSLCommerz payment initiated successfully!",
      data: result,
    });
  }
);

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.body;
  const result = await PaymentService.confirmPayment(paymentId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment confirmed successfully!",
    data: result,
  });
});

const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await PaymentService.confirmStripePayment(session.id);
      break;
    }
    default: {
      console.log(`Unhandled event type ${event.type}`);
    }
  }

  res.status(200).json({ received: true });
});

const sslCommerzSuccess = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.handleSSLCommerzWebhook(req.body);
  
  // Redirect to frontend success page
  res.redirect(`${process.env.CLIENT_URL}/payment/success?paymentId=${result.id}`);
});

const sslCommerzFail = catchAsync(async (req: Request, res: Response) => {
  const { tran_id } = req.body;
  
  // Update payment status to failed
  // await PaymentService.updatePaymentStatus(tran_id, "FAILED");
  
  res.redirect(`${process.env.CLIENT_URL}/payment/failed?transactionId=${tran_id}`);
});

const sslCommerzCancel = catchAsync(async (req: Request, res: Response) => {
  const { tran_id } = req.body;
  res.redirect(`${process.env.CLIENT_URL}/payment/cancelled?transactionId=${tran_id}`);
});

const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const result = await PaymentService.getPaymentStatus(paymentId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment status fetched successfully!",
    data: result,
  });
});

const stripeConfirm = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.body as { sessionId: string };
  const result = await PaymentService.confirmStripePayment(sessionId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stripe payment confirmed successfully!",
    data: result,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getAllPayments(req.query, (req as any).user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payments fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const releasePayout = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.body as { paymentId: string };
  const result = await PaymentService.releaseGuidePayout(paymentId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Guide payout released successfully!",
    data: result,
  });
});

const getReceipt = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { paymentId } = req.params as { paymentId: string };
  const receiptUrl = await PaymentService.getReceiptUrl(paymentId, req.user as IAuthUser);
  res.redirect(receiptUrl);
});

export const PaymentController = {
  initiateStripePayment,
  initiateSSLCommerzPayment,
  confirmPayment,
  stripeWebhook,
  stripeConfirm,
  getAllPayments,
  releasePayout,
  sslCommerzSuccess,
  sslCommerzFail,
  sslCommerzCancel,
  getPaymentStatus,
  getReceipt,
};
