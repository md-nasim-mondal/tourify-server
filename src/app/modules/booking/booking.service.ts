import { BookingStatus, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper } from "../../../helpers/paginationHelper";

// 1. Create Booking (Only Tourist)
const createBooking = async (payload: any, user: IAuthUser) => {
  // Security Check: User must exist
  if (!user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "User not found or authorized!"
    );
  }

  // Validate payload
  if (!payload.listingId || !payload.date) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "listingId and date are required!"
    );
  }

  const groupSize = payload.groupSize || 1;

  // Validate groupSize
  if (groupSize < 1 || !Number.isInteger(groupSize)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Group size must be a positive integer!"
    );
  }

  // Check if listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: payload.listingId },
    include: { guide: true },
  });

  if (!listing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Listing not found!");
  }

  // Validate that maxGroupSize is defined
  if (!listing.maxGroupSize) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Listing does not have a maximum group size defined!"
    );
  }

  // Prevent Guide from booking their own listing
  if (listing.guideId === user.id) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot book your own listing!"
    );
  }

  // Check if groupSize exceeds maxGroupSize
  if (groupSize > listing.maxGroupSize) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Group size cannot exceed maximum of ${listing.maxGroupSize} people!`
    );
  }

  const bookingDate = new Date(payload.date);

  // Check for existing bookings on same date
  const existingBookings = await prisma.booking.findMany({
    where: {
      listingId: payload.listingId,
      date: {
        gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        lt: new Date(bookingDate.setHours(23, 59, 59, 999)),
      },
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    },
  });

  // Calculate total group size for this date
  const totalGroupSize =
    existingBookings.reduce(
      (sum, booking) => sum + (booking.groupSize || 1),
      0
    ) + groupSize;

  // Check if total group size exceeds maxGroupSize limit
  if (totalGroupSize > listing.maxGroupSize) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Not enough capacity for ${groupSize} people. Available: ${
        listing.maxGroupSize - (totalGroupSize - groupSize)
      } people for this date!`
    );
  }

  const totalPrice = listing.price * groupSize;

  const result = await prisma.booking.create({
    data: {
      listingId: payload.listingId,
      touristId: user.id,
      groupSize: groupSize,
      date: bookingDate,
      status: BookingStatus.PENDING,
      totalPrice: totalPrice,
    },
    include: {
      listing: {
        include: {
          guide: {
            select: {
              name: true,
              email: true,
              contactNo: true,
            },
          },
        },
      },
      tourist: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return result;
};

// 2. Get All Bookings (Filtered by Role)
const getAllBookings = async (options: any, user: IAuthUser) => {
  // Security Check: User must exist
  if (!user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "User not found or authorized!"
    );
  }

  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const andConditions: any[] = [];

  // Role-based filtering
  if (user.role === UserRole.TOURIST) {
    // Tourist sees only their bookings
    andConditions.push({ touristId: user.id });
  } else if (user.role === UserRole.GUIDE) {
    // Guide sees bookings ONLY for their listings
    andConditions.push({
      listing: {
        guideId: user.id,
      },
    });
  }
  // Admin/Super Admin sees ALL bookings (No filter added)

  const whereConditions =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.booking.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder }
      : { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          guide: {
            select: { name: true, email: true },
          },
        },
      },
      tourist: {
        select: {
          name: true,
          email: true,
          contactNo: true, // Needed for Guide to contact Tourist
          photo: true,
        },
      },
      payment: true,
    },
  });

  const total = await prisma.booking.count({ where: whereConditions });

  return { meta: { page, limit, total }, data: result };
};

// 3. Get Single Booking (With Authorization Check)
const getSingleBooking = async (id: string, user: IAuthUser) => {
  // Security Check: User must exist
  if (!user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "User not found or authorized!"
    );
  }

  const result = await prisma.booking.findUniqueOrThrow({
    where: { id },
    include: {
      listing: true,
      tourist: true,
      payment: true,
    },
  });

  // Authorization Check: Only Admin, the Tourist who booked, or the Guide who owns the listing can view
  const isTourist = result.touristId === user.id;
  const isGuide = result.listing.guideId === user.id;
  const isAdmin =
    user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

  if (!isTourist && !isGuide && !isAdmin) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this booking!"
    );
  }

  return result;
};

// 4. Update Booking Status (Accept/Reject/Cancel)
const updateBookingStatus = async (
  id: string,
  status: BookingStatus,
  user: IAuthUser
) => {
  // Security Check: User must exist
  if (!user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "User not found or authorized!"
    );
  }

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id },
    include: { listing: true },
  });

  // Prevent any changes after completion
  if (booking.status === BookingStatus.COMPLETED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Completed bookings cannot be updated"
    );
  }

  // Authorization Logic
  if (user.role === UserRole.GUIDE) {
    // Guide can only update bookings for their listings
    if (booking.listing.guideId !== user.id) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You can only manage bookings for your own listings!"
      );
    }
    // Guide transition rules
    if (status === BookingStatus.CONFIRMED) {
      if (booking.status !== BookingStatus.PENDING) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Only pending bookings can be accepted"
        );
      }
    }
    if (status === BookingStatus.CANCELLED) {
      if (booking.status !== BookingStatus.PENDING) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Only pending bookings can be declined"
        );
      }
    }
    if (status === BookingStatus.COMPLETED) {
      // Completion allowed only after tour date has passed and status was confirmed
      const now = new Date();
      if (booking.status !== BookingStatus.CONFIRMED || booking.date >= now) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Only past confirmed bookings can be marked as completed"
        );
      }
    }
  } else if (user.role === UserRole.TOURIST) {
    // Tourist can only CANCEL their own booking if it's still PENDING
    if (booking.touristId !== user.id) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You can only manage your own bookings!"
      );
    }
    if (status !== BookingStatus.CANCELLED) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Tourists can only Cancel bookings!"
      );
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Only pending bookings can be cancelled by tourist"
      );
    }
  }

  const result = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  return result;
};

// 5. Get all unique booked dates for a specific guide
const getBookingDatesByGuide = async (guideId: string) => {
  const bookings = await prisma.booking.findMany({
    where: {
      listing: {
        guideId: guideId,
      },
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    },
    select: {
      date: true,
    },
    distinct: ["date"], // Get only unique dates
  });

  return bookings.map((booking) => booking.date);
};

export const BookingService = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBookingStatus,
  getBookingDatesByGuide,
};
