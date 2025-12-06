import { BookingStatus, PaymentStatus } from "@prisma/client";
import httpStatus from "http-status";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";

// 1. Initiate Payment (Create Payment Record)
const initiatePayment = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found!");
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot pay for a cancelled booking!"
    );
  }

  // Check if already paid
  const existingPayment = await prisma.payment.findUnique({
    where: { bookingId },
  });

  if (existingPayment && existingPayment.status === PaymentStatus.PAID) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Booking is already paid!");
  }

  const transactionId = `TXN-${Date.now()}`; // Simulated Transaction ID

  // Create Payment Record
  const result = await prisma.payment.create({
    data: {
      bookingId,
      amount: booking.listing.price, // Assuming listing price is the amount
      transactionId,
      status: PaymentStatus.PENDING,
    },
  });

  // In a real scenario, you would return a Stripe Payment URL here
  return {
    paymentId: result.id,
    transactionId,
    amount: result.amount,
    message: "Payment initiated successfully. Proceed to gateway.",
    // paymentUrl: "https://sandbox.sslcommerz.com/..." (If integrating real gateway)
  };
};

// 2. Confirm Payment (Simulating Webhook or Success Page)
const confirmPayment = async (paymentId: string) => {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
  });

  // Update Payment Status to PAID
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.PAID },
  });

  // Update Booking Status to CONFIRMED automatically
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: BookingStatus.CONFIRMED },
  });

  return updatedPayment;
};

export const PaymentService = {
  initiatePayment,
  confirmPayment,
};
