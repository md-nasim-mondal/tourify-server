import { z } from "zod";

const initiatePaymentValidation = z.object({
  body: z.object({
    bookingId: z.string({ error: "Booking ID is required" }),
    amount: z.number({ error: "Amount is required" }).positive(),
  }),
});

const paymentSuccessValidation = z.object({
  query: z.object({
    transactionId: z.string({ error: "Transaction ID is required" }),
  }),
});

export const PaymentValidation = {
  initiatePaymentValidation,
  paymentSuccessValidation,
};
