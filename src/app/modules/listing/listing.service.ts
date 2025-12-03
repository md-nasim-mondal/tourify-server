import { Prisma, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { listingSearchableFields } from "./listing.constants";
import { fileUploader } from "../../../helpers/fileUploader";

// 1. Create Listing
const createListing = async (req: any, user: IAuthUser) => {
  const files = req.files as Express.Multer.File[];
  const imagePaths: string[] = [];

  if (!user) {
    throw new ApiError(httpStatus.FORBIDDEN, "Please signIn first!");
  }

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
      ...req.body,
      price: Number(req.body.price), // Ensure price is number
      images: imagePaths,
      guideId: user.id, // Set the guide who created this
    },
    include: {
      guide: true,
    },
  });

  return result;
};

// 2. Get All Listings (Public + Filter + Search)
const getAllListings = async (params: any, options: any) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, minPrice, maxPrice, ...filterData } = params;

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
          name: true,
          email: true,
          photo: true,
        },
      },
    },
  });

  const total = await prisma.listing.count({ where: whereConditions });

  return { meta: { page, limit, total }, data: result };
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
        },
      },
      reviews: true, // Include reviews if any
    },
  });
  return result;
};

// 4. Update Listing (Only Owner Guide)
const updateListing = async (id: string, payload: any, user: IAuthUser) => {
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

  const result = await prisma.listing.update({
    where: { id },
    data: payload,
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

export const ListingService = {
  createListing,
  getAllListings,
  getSingleListing,
  updateListing,
  deleteListing,
};
