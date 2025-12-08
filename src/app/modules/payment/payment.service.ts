import { BookingStatus, PaymentStatus } from "@prisma/client";
import httpStatus from "http-status";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

// 1. Initiate Payment with Stripe
const initiateStripePayment = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { 
      listing: true,
      tourist: true 
    },
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

  const transactionId = `STRIPE-${Date.now()}`;

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"] as const,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: booking.listing.title,
            description: `Booking for ${booking.date.toLocaleDateString()}`,
            images: booking.listing.images.length > 0 ? [booking.listing.images[0]].filter((img): img is string => img !== undefined) : [],
          },
          unit_amount: Math.round(booking.listing.price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    metadata: {
      bookingId,
      touristId: booking.touristId,
      transactionId,
    },
  });

  // Create Payment Record
  const payment = await prisma.payment.create({
    data: {
      bookingId,
      amount: booking.listing.price,
      transactionId,
      status: PaymentStatus.PENDING,
      paymentGatewayData: {
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
      },
    },
  });

  return {
    paymentId: payment.id,
    transactionId,
    amount: payment.amount,
    paymentUrl: session.url,
    sessionId: session.id,
  };
};

// 2. Initiate Payment with SSLCommerz
const initiateSSLCommerzPayment = async (bookingId: string) => {
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

  const transactionId = `SSL-${Date.now()}`;

  // SSLCommerz Payment Data
  const _sslData = {
    store_id: process.env.SSL_STORE_ID || "testbox",
    store_passwd: process.env.SSL_STORE_PASSWORD || "qwerty",
    total_amount: booking.listing.price,
    currency: "BDT",
    tran_id: transactionId,
    success_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz-success`,
    fail_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz-fail`,
    cancel_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz-cancel`,
    cus_name: "Customer Name",
    cus_email: "customer@example.com",
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    product_name: booking.listing.title,
    product_category: booking.listing.category || "Tour",
    product_profile: "general",
  };

  // Create Payment Record first
  const payment = await prisma.payment.create({
    data: {
      bookingId,
      amount: booking.listing.price,
      transactionId,
      status: PaymentStatus.PENDING,
      paymentGatewayData: {
        gateway: "SSLCommerz",
        initiatedAt: new Date().toISOString(),
      },
    },
  });

  // In production, you would make API call to SSLCommerz
  // const response = await axios.post("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", sslData);
  
  // For demo, return a mock URL
  const paymentUrl = process.env.NODE_ENV === "production"
    ? `https://sandbox.sslcommerz.com/gwprocess/v4/api.php?tran_id=${transactionId}`
    : `${process.env.CLIENT_URL}/payment/demo-success?paymentId=${payment.id}`;

  return {
    paymentId: payment.id,
    transactionId,
    amount: payment.amount,
    paymentUrl,
    message: "SSLCommerz payment initiated",
  };
};

// 3. Confirm Stripe Payment (Webhook)
const confirmStripePayment = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment not completed!");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      paymentGatewayData: {
        path: ["stripeSessionId"],
        equals: sessionId,
      },
    },
  });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment record not found!");
  }

  // Update Payment Status
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { 
      status: PaymentStatus.PAID,
      paymentGatewayData: {
        ...payment.paymentGatewayData as any,
        stripePaymentStatus: session.payment_status,
        paidAt: new Date().toISOString(),
      },
    },
  });

  // Update Booking Status
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: BookingStatus.CONFIRMED },
  });

  return updatedPayment;
};

// 4. Confirm Payment (Manual for demo)
const confirmPayment = async (paymentId: string) => {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
  });

  // Update Payment Status to PAID
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: { 
      status: PaymentStatus.PAID,
      paymentGatewayData: {
        ...payment.paymentGatewayData as any,
        confirmedAt: new Date().toISOString(),
        confirmedBy: "MANUAL",
      },
    },
  });

  // Update Booking Status to CONFIRMED
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: BookingStatus.CONFIRMED },
  });

  return updatedPayment;
};

// 5. SSLCommerz Webhook Handler
const handleSSLCommerzWebhook = async (payload: any) => {
  const { tran_id, status, val_id } = payload;

  if (status !== "VALID") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment not valid!");
  }

  const payment = await prisma.payment.findFirst({
    where: { transactionId: tran_id },
  });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found!");
  }

  // Verify with SSLCommerz (in production)
  // const verifyResponse = await axios.get(`https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${process.env.SSL_STORE_ID}&store_passwd=${process.env.SSL_STORE_PASSWORD}&format=json`);

  // Update Payment
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { 
      status: PaymentStatus.PAID,
      paymentGatewayData: {
        ...payment.paymentGatewayData as any,
        sslcommerzValId: val_id,
        verifiedAt: new Date().toISOString(),
      },
    },
  });

  // Update Booking
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: BookingStatus.CONFIRMED },
  });

  return updatedPayment;
};

// 6. Get Payment Status
const getPaymentStatus = async (paymentId: string) => {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          listing: {
            select: {
              title: true,
              guide: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return payment;
};

export const PaymentService = {
  initiateStripePayment,
  initiateSSLCommerzPayment,
  confirmStripePayment,
  confirmPayment,
  handleSSLCommerzWebhook,
  getPaymentStatus,
};