import { UserRole } from "@prisma/client";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";

const getDashboardMetadata = async (user: IAuthUser) => {
  if (!user)
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authorized!");

  let metadata;

  switch (user.role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      metadata = await getAdminMetadata();
      break;
    case UserRole.GUIDE:
      metadata = await getGuideMetadata(user.id);
      break;
    case UserRole.TOURIST:
      metadata = await getTouristMetadata(user.id);
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid User Role");
  }

  return metadata;
};

// Admin Stats
const getAdminMetadata = async () => {
  const totalUsers = await prisma.user.count();
  const totalListings = await prisma.listing.count();
  const totalBookings = await prisma.booking.count();
  const totalRevenueResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "PAID" },
  });

  return {
    totalUsers,
    totalListings,
    totalBookings,
    totalRevenue: totalRevenueResult._sum.amount || 0,
  };
};

// Guide Stats
const getGuideMetadata = async (guideId: string) => {
  const totalListings = await prisma.listing.count({ where: { guideId } });

  const totalBookings = await prisma.booking.count({
    where: { listing: { guideId } },
  });

  // Calculate Rating
  const listings = await prisma.listing.findMany({
    where: { guideId },
    include: { reviews: true },
  });

  let totalRating = 0;
  let reviewCount = 0;

  listings.forEach((listing) => {
    listing.reviews.forEach((review) => {
      totalRating += review.rating;
      reviewCount++;
    });
  });

  const avgRating =
    reviewCount > 0 ? (totalRating / reviewCount).toFixed(2) : 0;

  return {
    totalListings,
    totalBookings,
    totalReviews: reviewCount,
    averageRating: avgRating,
  };
};

// Tourist Stats
const getTouristMetadata = async (touristId: string) => {
  const totalBookings = await prisma.booking.count({ where: { touristId } });
  const completedTrips = await prisma.booking.count({
    where: { touristId, status: "COMPLETED" },
  });
  const upcomingTrips = await prisma.booking.count({
    where: {
      touristId,
      status: "CONFIRMED",
      date: {
        gte: new Date(),
      },
    },
  });

  const spendAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      status: "PAID",
      booking: { touristId },
    },
  });

  return {
    totalBookings,
    completedTrips,
    upcomingTrips,
    totalSpend: spendAgg._sum.amount || 0,
  };
};

export const MetaService = {
  getDashboardMetadata,
};
