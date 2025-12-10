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

  // Check if listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: payload.listingId },
    include: { guide: true },
  });

  if (!listing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Listing not found!");
  }

  // Prevent Guide from booking their own listing
  if (listing.guideId === user.id) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot book your own listing!"
    );
  }

  // Check if listing has maxGroupSize
  const bookingDate = new Date(payload.date);

  // *** NEW: Check Guide Availability ***
  const guideAvailability = await prisma.availability.findFirst({
    where: {
      guideId: listing.guideId,
      date: {
        gte: new Date(bookingDate.setHours(0, 0, 0, 0)), // Start of the day
        lt: new Date(bookingDate.setHours(23, 59, 59, 999)), // End of the day
      },
      isAvailable: true,
    },
  });

  if (!guideAvailability) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The guide is not available for booking on this date!"
    );
  }
  // *** END NEW ***
  
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

  // Check maxGroupSize limit
  if (listing.maxGroupSize && existingBookings.length >= listing.maxGroupSize) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This tour is fully booked for the selected date!"
    );
  }

  const result = await prisma.booking.create({
    data: {
      listingId: payload.listingId,
      touristId: user.id,
      date: bookingDate,
      status: BookingStatus.PENDING,
      totalPrice: listing.price,
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

  // Authorization Logic
  if (user.role === UserRole.GUIDE) {
    // Guide can only update bookings for their listings
    if (booking.listing.guideId !== user.id) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You can only manage bookings for your own listings!"
      );
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
  }

  const result = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  return result;
};

export const BookingService = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBookingStatus,
};
