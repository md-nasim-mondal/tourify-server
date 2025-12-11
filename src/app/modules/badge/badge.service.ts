import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";

const createBadge = async (payload: {
  name: string;
  description?: string;
  icon?: string;
  criteria?: string;
}) => {
  const exists = await prisma.badge.findUnique({
    where: { name: payload.name },
  });
  if (exists) {
    throw new ApiError(httpStatus.CONFLICT, "Badge name already exists");
  }
  const result = await prisma.badge.create({ data: payload });
  return result;
};

const assignBadgeToUser = async (userId: string, badgeId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
  if (!badge) throw new ApiError(httpStatus.NOT_FOUND, "Badge not found");

  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });
  if (existing) {
    return existing; // idempotent
  }

  const result = await prisma.userBadge.create({ data: { userId, badgeId } });
  return result;
};

const revokeBadgeFromUser = async (userId: string, badgeId: string) => {
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });
  if (!existing)
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have this badge");
  const result = await prisma.userBadge.delete({
    where: { userId_badgeId: { userId, badgeId } },
  });
  return result;
};

const getAllBadges = async (
  params: { searchTerm?: string; name?: string },
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.BadgeWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const whereConditions: Prisma.BadgeWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.badge.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder }
      : { createdAt: "desc" },
  });

  const total = await prisma.badge.count({ where: whereConditions });

  return { meta: { page, limit, total }, data: result };
};

const getSingleBadge = async (id: string) => {
  const result = await prisma.badge.findUnique({
    where: { id },
    include: { users: true },
  });
  if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Badge not found");
  return result;
};

const updateBadge = async (
  id: string,
  payload: {
    name?: string;
    description?: string;
    icon?: string;
    criteria?: string;
  }
) => {
  if (payload.name) {
    const exists = await prisma.badge.findUnique({
      where: { name: payload.name },
    });
    if (exists && exists.id !== id) {
      throw new ApiError(httpStatus.CONFLICT, "Badge name already exists");
    }
  }

  const result = await prisma.badge.update({ where: { id }, data: payload });
  return result;
};

const deleteBadge = async (id: string) => {
  // Cascade delete of userBadge handled by Prisma relation
  const result = await prisma.badge.delete({ where: { id } });
  return result;
};

export const BadgeService = {
  createBadge,
  assignBadgeToUser,
  revokeBadgeFromUser,
  getAllBadges,
  getSingleBadge,
  updateBadge,
  deleteBadge,
};
