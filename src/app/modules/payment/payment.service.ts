import { BookingStatus, PaymentStatus } from "@prisma/client";
import httpStatus from "http-status";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import Stripe from "stripe";
import { fileUploader } from "../../../helpers/fileUploader";
import PDFDocument from "pdfkit";

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
      tourist: true,
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
  if (
    booking.status !== BookingStatus.CONFIRMED &&
    booking.status !== BookingStatus.COMPLETED
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Booking must be accepted by the guide before payment"
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
            images:
              booking.listing.images.length > 0
                ? [booking.listing.images[0]].filter(
                    (img): img is string => img !== undefined
                  )
                : [],
          },
          unit_amount: Math.round(
            (booking.totalPrice || booking.listing.price) * 100
          ),
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

  // Create or Update Payment Record
  let payment;
  if (existingPayment && existingPayment.status === PaymentStatus.PENDING) {
    payment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        amount: booking.totalPrice || booking.listing.price,
        transactionId,
        paymentGatewayData: {
          ...(existingPayment.paymentGatewayData as any),
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
          reinitiatedAt: new Date().toISOString(),
        },
      },
    });
  } else {
    payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: booking.totalPrice || booking.listing.price,
        transactionId,
        status: PaymentStatus.PENDING,
        paymentGatewayData: {
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
        },
      },
    });
  }

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
  if (
    booking.status !== BookingStatus.CONFIRMED &&
    booking.status !== BookingStatus.COMPLETED
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Booking must be accepted by the guide before payment"
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

  // Create or Update Payment Record first
  let payment;
  if (existingPayment && existingPayment.status === PaymentStatus.PENDING) {
    payment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        amount: booking.totalPrice || booking.listing.price,
        transactionId,
        paymentGatewayData: {
          gateway: "SSLCommerz",
          reinitiatedAt: new Date().toISOString(),
        },
      },
    });
  } else {
    payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: booking.totalPrice || booking.listing.price,
        transactionId,
        status: PaymentStatus.PENDING,
        paymentGatewayData: {
          gateway: "SSLCommerz",
          initiatedAt: new Date().toISOString(),
        },
      },
    });
  }

  // In production, you would make API call to SSLCommerz
  // const response = await axios.post("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", sslData);

  // For demo, return a mock URL
  const paymentUrl =
    process.env.NODE_ENV === "production"
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
        ...(payment.paymentGatewayData as any),
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

  // Generate and store receipt
  await generateAndStoreReceipt(updatedPayment.id);

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
        ...(payment.paymentGatewayData as any),
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

  // Generate and store receipt
  await generateAndStoreReceipt(updatedPayment.id);

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
        ...(payment.paymentGatewayData as any),
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

  // Generate and store receipt
  await generateAndStoreReceipt(updatedPayment.id);

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

// Compose receipt data and upload to Cloudinary, then store secure_url inside paymentGatewayData.receiptUrl
const generateAndStoreReceipt = async (paymentId: string) => {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          listing: {
            select: { title: true, guideId: true, guide: { select: { name: true } } },
          },
          tourist: { select: { name: true, email: true } },
        },
      },
    },
  });
  const appName = "Tourify";
  const appUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const paidAt =
    typeof payment.paymentGatewayData === "object" &&
    payment.paymentGatewayData !== null &&
    "paidAt" in (payment.paymentGatewayData as any)
      ? (payment.paymentGatewayData as any).paidAt
      : new Date().toISOString();

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (d: Buffer) => chunks.push(d));
  const done: Promise<Buffer> = new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fillColor("#111827").fontSize(22).text(`${appName} Payment Receipt`, { align: "center" });
  doc.moveDown(0.5);
  doc.fillColor("#6b7280").fontSize(12).text(appUrl, { align: "center", link: appUrl, underline: true });
  doc.moveDown(1.5);

  doc.fillColor("#111827").fontSize(16).text("Booking & Payment Details");
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#374151");
  doc.text(`Payment ID: ${payment.id}`);
  doc.text(`Transaction ID: ${payment.transactionId}`);
  doc.text(`Status: ${payment.status}`);
  doc.text(`Amount: $${payment.amount.toFixed(2)}`);
  doc.text(`Paid At: ${new Date(paidAt).toLocaleString()}`);
  doc.moveDown(0.5);
  doc.text(`Booking ID: ${payment.bookingId}`);
  doc.text(`Booking Date: ${new Date((payment as any).booking?.date).toLocaleDateString()}`);
  doc.text(`Tour: ${(payment as any).booking?.listing?.title}`);
  doc.moveDown(0.5);

  doc.fillColor("#111827").fontSize(16).text("Participants");
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#374151");
  doc.text(`Tourist: ${(payment as any).booking?.tourist?.name} (${(payment as any).booking?.tourist?.email})`);
  doc.text(`Guide: ${(payment as any).booking?.listing?.guide?.name}`);
  doc.moveDown(1);

  doc.fillColor("#6b7280").fontSize(10).text("This receipt is generated by Tourify.", { align: "center" });
  doc.end();

  const buffer = await done;
  const upload = await fileUploader.uploadBufferToCloudinary(
    buffer,
    `receipt-${payment.id}`,
    "raw",
    "pdf"
  );
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      paymentGatewayData: {
        ...(payment.paymentGatewayData as any),
        receiptUrl: upload.secure_url,
      },
    },
  });
  return upload.secure_url;
};

// Return receipt URL with authorization checks
const getReceiptUrl = async (paymentId: string, user: any) => {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: { booking: { include: { listing: true } } },
  });
  const touristOwns = payment.booking.touristId === user.id;
  const guideOwns = payment.booking.listing.guideId === user.id;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
  if (!touristOwns && !guideOwns && !isAdmin) {
    throw new ApiError(httpStatus.FORBIDDEN, "Not authorized to access this receipt");
  }
  let receiptUrl =
    typeof payment.paymentGatewayData === "object" &&
    payment.paymentGatewayData !== null &&
    "receiptUrl" in (payment.paymentGatewayData as any)
      ? (payment.paymentGatewayData as any).receiptUrl
      : null;
  if (!receiptUrl) {
    receiptUrl = await generateAndStoreReceipt(payment.id);
  }
  return receiptUrl;
};

const getGuidePayments = async (options: any, user: any) => {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    const result = await prisma.payment.findMany({
      where: {
        booking: {
          listing: {
            guideId: user.id,
          },
        },
        status: PaymentStatus.PAID,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            listing: {
              select: { title: true },
            },
            tourist: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    const total = await prisma.payment.count({
      where: {
        booking: {
          listing: {
            guideId: user.id,
          },
        },
        status: PaymentStatus.PAID,
      },
    });

    const earningsAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        booking: {
          listing: {
            guideId: user.id,
          },
        },
        status: PaymentStatus.PAID,
      },
    });

    return {
      meta: { page, limit, total },
      data: result,
      totalEarnings: earningsAgg._sum.amount || 0,
    };
};

export const PaymentService = {
  initiateStripePayment,
  initiateSSLCommerzPayment,
  confirmStripePayment,
  confirmPayment,
  handleSSLCommerzWebhook,
  getPaymentStatus,
  getReceiptUrl,
  async getAllPayments(options: any, _user: any) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;
    const result = await prisma.payment.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            listing: {
              select: { title: true, guideId: true },
            },
            tourist: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
    const total = await prisma.payment.count();
    return { meta: { page, limit, total }, data: result };
  },
  async releaseGuidePayout(paymentId: string) {
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { booking: { include: { listing: true } } },
    });
    if (payment.status !== PaymentStatus.PAID) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Payment not settled");
    }
    const booking = payment.booking;
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Booking not completed");
    }
    const platformFeeRate = 0.1;
    const payoutAmount =
      (payment.amount || booking.listing.price) * (1 - platformFeeRate);
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentGatewayData: {
          ...(payment.paymentGatewayData as any),
          payoutReleasedAt: new Date().toISOString(),
          payoutAmount,
          guideId: booking.listing.guideId,
        },
      },
    });
    return updated;
  },
  getGuidePayments,
};
