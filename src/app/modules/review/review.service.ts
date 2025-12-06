import { BookingStatus } from "@prisma/client";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";

// 1. Create Review
const createReview = async (payload: any, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found!");
  }

  // Check if the tourist has a COMPLETED booking for this listing
  const booking = await prisma.booking.findFirst({
    where: {
      listingId: payload.listingId,
      touristId: user.id,
      status: BookingStatus.COMPLETED, // Only completed tours can be reviewed
    },
  });

  if (!booking) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You can only review a tour after completing it!"
    );
  }

  // Check if already reviewed
  const isReviewed = await prisma.review.findFirst({
    where: {
      listingId: payload.listingId,
      touristId: user.id,
    },
  });

  if (isReviewed) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this listing!"
    );
  }

  const result = await prisma.review.create({
    data: {
      listingId: payload.listingId,
      touristId: user.id,
      rating: payload.rating,
      comment: payload.comment,
    },
  });

  return result;
};

// 2. Get All Reviews for a Listing
const getReviewsByListing = async (listingId: string) => {
  const result = await prisma.review.findMany({
    where: { listingId },
    include: {
      tourist: {
        select: {
          name: true,
          photo: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return result;
};

export const ReviewService = {
  createReview,
  getReviewsByListing,
};
