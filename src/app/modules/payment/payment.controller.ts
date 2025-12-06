import { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.body;
  const result = await PaymentService.initiatePayment(bookingId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Payment initiated!",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.body; // In real life, this comes from Gateway Webhook
  const result = await PaymentService.confirmPayment(paymentId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment confirmed & Booking verified!",
    data: result,
  });
});

export const PaymentController = {
  initiatePayment,
  confirmPayment,
};
