/* eslint-disable @typescript-eslint/no-unused-vars */
import { Prisma, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import {
  listingSearchableFields,
  listingCategories,
  listingLanguages,
} from "./listing.constants";
import { fileUploader } from "../../../helpers/fileUploader";

// 1. Create Listing
const createListing = async (req: any, user: IAuthUser) => {
  const files = req.files as Express.Multer.File[];
  const imagePaths: string[] = [];

  if (!user) {
    throw new ApiError(httpStatus.FORBIDDEN, "Please signIn first!");
  }

  // Validate category
  if (req.body.category && !listingCategories.includes(req.body.category)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid category!");
  }

  // Validate languages
  if (req.body.languages) {
    const languagesArray = Array.isArray(req.body.languages)
      ? req.body.languages
      : [req.body.languages];

    const invalidLanguages = languagesArray.filter(
      (lang: string) => !listingLanguages.includes(lang)
    );

    if (invalidLanguages.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid language(s): ${invalidLanguages.join(", ")}`
      );
    }
  }

  // Upload images
  if (files && files.length > 0) {
    for (const file of files) {
      const uploaded = await fileUploader.uploadToCloudinary(file);
      if (uploaded?.secure_url) {
        imagePaths.push(uploaded.secure_url);
      }
    }
  }

  const result = await prisma.listing.create({
    data: {
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      latitude: req.body.latitude ? Number(req.body.latitude) : null, // NEW
      longitude: req.body.longitude ? Number(req.body.longitude) : null, // NEW
      price: Number(req.body.price),
      duration: req.body.duration,
      maxGroupSize: req.body.maxGroupSize
        ? Number(req.body.maxGroupSize)
        : null,
      category: req.body.category,
      languages: req.body.languages
        ? Array.isArray(req.body.languages)
          ? req.body.languages
          : [req.body.languages]
        : [],
      meetingPoint: req.body.meetingPoint,
      images: imagePaths,
      guideId: user.id,
    },
    include: {
      guide: {
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
          bio: true,
          languagesSpoken: true,
          expertise: true,
        },
      },
    },
  });

  return result;
};

// 2. Get All Listings (Public + Filter + Search)
const getAllListings = async (params: any, options: any) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const {
    searchTerm,
    minPrice,
    maxPrice,
    category,
    language,
    page: _page,
    limit: _limit,
    sortBy: _sortBy,
    sortOrder: _sortOrder,
    ...filterData
  } = params;

  const andConditions: Prisma.ListingWhereInput[] = [];

  // Search Logic
  if (searchTerm) {
    andConditions.push({
      OR: listingSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  // Price Range Logic
  if (minPrice) {
    andConditions.push({ price: { gte: Number(minPrice) } });
  }
  if (maxPrice) {
    andConditions.push({ price: { lte: Number(maxPrice) } });
  }

  // Category Filter
  if (category) {
    andConditions.push({ category: { equals: category } });
  }

  // Language Filter
  if (language) {
    andConditions.push({ languages: { has: language } });
  }

  // Exact Match Filters (e.g., location)
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const whereConditions: Prisma.ListingWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.listing.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder }
      : { createdAt: "desc" },
    include: {
      guide: {
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
          bio: true,
          languagesSpoken: true,
          expertise: true,
        },
      },
      reviews: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          reviews: true,
          bookings: true,
        },
      },
    },
  });

  // Calculate average rating for each listing
  const listingsWithRating = result.map((listing) => {
    const totalRating = listing.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating =
      listing.reviews.length > 0
        ? (totalRating / listing.reviews.length).toFixed(1)
        : "0.0";

    return {
      ...listing,
      averageRating: parseFloat(averageRating),
      totalReviews: listing.reviews.length,
    };
  });

  const total = await prisma.listing.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: listingsWithRating,
    filters: {
      categories: listingCategories,
      languages: listingLanguages,
    },
  };
};

const getMyCreateListings = async (
  params: any,
  options: any,
  user: IAuthUser
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const {
    searchTerm,
    minPrice,
    maxPrice,
    category,
    language,
    page: _page,
    limit: _limit,
    sortBy: _sortBy,
    sortOrder: _sortOrder,
    ...filterData
  } = params;

  const andConditions: Prisma.ListingWhereInput[] = [];

  // Search Logic
  if (searchTerm) {
    andConditions.push({
      OR: listingSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  // Price Range Logic
  if (minPrice) {
    andConditions.push({ price: { gte: Number(minPrice) } });
  }
  if (maxPrice) {
    andConditions.push({ price: { lte: Number(maxPrice) } });
  }

  // Category Filter
  if (category) {
    andConditions.push({ category: { equals: category } });
  }

  // Language Filter
  if (language) {
    andConditions.push({ languages: { has: language } });
  }

  // Exact Match Filters (e.g., location)
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  // Filter by guideId (current user's ID)
  if (user?.id) {
    andConditions.push({ guideId: user.id });
  }

  const whereConditions: Prisma.ListingWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.listing.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder }
      : { createdAt: "desc" },
    include: {
      guide: {
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
          bio: true,
          languagesSpoken: true,
          expertise: true,
        },
      },
      reviews: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          reviews: true,
          bookings: true,
        },
      },
    },
  });

  // Calculate average rating for each listing
  const listingsWithRating = result.map((listing) => {
    const totalRating = listing.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating =
      listing.reviews.length > 0
        ? (totalRating / listing.reviews.length).toFixed(1)
        : "0.0";

    return {
      ...listing,
      averageRating: parseFloat(averageRating),
      totalReviews: listing.reviews.length,
    };
  });

  const total = await prisma.listing.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: listingsWithRating,
    filters: {
      categories: listingCategories,
      languages: listingLanguages,
    },
  };
};

// 3. Get Single Listing
const getSingleListing = async (id: string) => {
  const result = await prisma.listing.findUniqueOrThrow({
    where: { id },
    include: {
      guide: {
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
          bio: true,
          contactNo: true,
          languagesSpoken: true,
          expertise: true,
          _count: {
            select: {
              listings: true,
              reviews: true,
            },
          },
        },
      },
      reviews: {
        include: {
          tourist: {
            select: {
              name: true,
              photo: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          reviews: true,
          bookings: true,
        },
      },
    },
  });

  // Calculate average rating
  const totalRating = result.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );
  const averageRating =
    result.reviews.length > 0
      ? (totalRating / result.reviews.length).toFixed(1)
      : "0.0";

  return {
    ...result,
    averageRating: parseFloat(averageRating),
    totalReviews: result.reviews.length,
  };
};

// 4. Update Listing (Only Owner Guide)
const updateListing = async (id: string, req: any, user: IAuthUser) => {
  const listing = await prisma.listing.findUniqueOrThrow({ where: { id } });

  if (!user) {
    throw new ApiError(httpStatus.FORBIDDEN, "Please signIn first!");
  }

  // Ownership Check
  if (listing.guideId !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only update your own listing!"
    );
  }

  const files = req.files as Express.Multer.File[];
  const imagePaths: string[] = [];

  // Upload new images if they exist
  if (files && files.length > 0) {
    for (const file of files) {
      const uploaded = await fileUploader.uploadToCloudinary(file);
      if (uploaded?.secure_url) {
        imagePaths.push(uploaded.secure_url);
      }
    }
    req.body.images = imagePaths;
  }

  // Validate category if provided
  if (req.body.category && !listingCategories.includes(req.body.category)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid category!");
  }

  // Validate languages if provided
  if (req.body.languages) {
    const languagesArray = Array.isArray(req.body.languages)
      ? req.body.languages
      : [req.body.languages];

    const invalidLanguages = languagesArray.filter(
      (lang: string) => !listingLanguages.includes(lang)
    );

    if (invalidLanguages.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid language(s): ${invalidLanguages.join(", ")}`
      );
    }
  }

  // Convert price to number if provided
  if (req.body.price) {
    req.body.price = Number(req.body.price);
  }

  // Convert maxGroupSize to number if provided
  if (req.body.maxGroupSize) {
    req.body.maxGroupSize = Number(req.body.maxGroupSize);
  }

  // Convert latitude and longitude to number if provided
  if (req.body.latitude) {
    req.body.latitude = Number(req.body.latitude);
  }
  if (req.body.longitude) {
    req.body.longitude = Number(req.body.longitude);
  }

  const result = await prisma.listing.update({
    where: { id },
    data: req.body,
    include: {
      guide: {
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
        },
      },
    },
  });

  return result;
};

// 5. Delete Listing (Owner Guide OR Admin)
const deleteListing = async (id: string, user: IAuthUser) => {
  const listing = await prisma.listing.findUniqueOrThrow({ where: { id } });

  if (!user) {
    throw new ApiError(httpStatus.FORBIDDEN, "Please signIn first!");
  }

  // Ownership Check (Allow if User is Admin OR if User is the Guide who owns it)
  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.SUPER_ADMIN &&
    listing.guideId !== user.id
  ) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not authorized to delete this listing!"
    );
  }

  const result = await prisma.listing.delete({
    where: { id },
  });

  return result;
};

// 6. Get Categories
const getCategories = async () => {
  return listingCategories;
};

// 7. Get Languages
const getLanguages = async () => {
  return listingLanguages;
};

// 8. Get Map Data
const getMapData = async (params: any) => {
  const whereConditions: Prisma.ListingWhereInput = {
    latitude: { not: null },
    longitude: { not: null },
    // Potentially add filters for geographical bounds from params
    // e.g., northEastLat, northEastLng, southWestLat, southWestLng
  };

  const result = await prisma.listing.findMany({
    where: whereConditions,
    select: {
      id: true,
      title: true,
      location: true,
      latitude: true,
      longitude: true,
      images: true, // For map markers/popups
      price: true, // For map markers/popups
      guide: {
        select: {
          id: true,
          name: true,
          photo: true,
        },
      },
    },
  });

  return result;
};

export const ListingService = {
  createListing,
  getAllListings,
  getSingleListing,
  updateListing,
  deleteListing,
  getCategories,
  getLanguages,
  getMapData,
  getMyCreateListings,
};
