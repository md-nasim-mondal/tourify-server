import { BookingStatus, UserRole, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { reviewSearchableFields } from "./review.constants";

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

// 2. Get All Reviews (Admin/Super Admin)
const getAllReviews = async (params: any, options: any) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.ReviewWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: reviewSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const whereConditions: Prisma.ReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.review.findMany({
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
          id: true,
        },
      },
      tourist: {
        select: {
          name: true,
          email: true,
          photo: true,
        },
      },
    },
  });

  const total = await prisma.review.count({ where: whereConditions });

  return { meta: { page, limit, total }, data: result };
};

// 3. Get Reviews for a Listing
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

// 4. Get Single Review
const getSingleReview = async (id: string) => {
  return await prisma.review.findUniqueOrThrow({
    where: { id },
    include: {
      listing: {
        select: {
          title: true,
          id: true,
        },
      },
      tourist: {
        select: {
          name: true,
          email: true,
          photo: true,
        },
      },
    },
  });
};

// 5. Update Review
const updateReview = async (id: string, payload: any, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found!");
  }

  const review = await prisma.review.findUniqueOrThrow({ where: { id } });

  // Authorization: Only the tourist who wrote the review or an Admin can update
  if (review.touristId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to update this review!");
  }

  return await prisma.review.update({
    where: { id },
    data: payload,
  });
};

// 6. Delete Review
const deleteReview = async (id: string, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found!");
  }

  const review = await prisma.review.findUniqueOrThrow({ where: { id } });

  // Authorization: Only the tourist who wrote the review or an Admin can delete
  if (review.touristId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to delete this review!");
  }

  return await prisma.review.delete({
    where: { id },
  });
};

export const ReviewService = {
  createReview,
  getAllReviews,
  getReviewsByListing,
  getSingleReview,
  updateReview,
  deleteReview,
};
