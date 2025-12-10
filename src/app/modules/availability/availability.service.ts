import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { IAuthUser } from '../../interfaces/common';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { prisma } from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';

const createAvailability = async (payload: any, user: IAuthUser) => {
  if (!user || user.role !== 'GUIDE') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only guides can create availability slots!');
  }

  const { date, startTime, endTime } = payload;
  const guideId = user.id;

  // Check for overlapping availability
  const existingAvailability = await prisma.availability.findFirst({
    where: {
      guideId,
      date: new Date(date),
      OR: [
        {
          startTime: { lt: new Date(endTime) },
          endTime: { gt: new Date(startTime) },
        },
      ],
    },
  });

  if (existingAvailability) {
    throw new ApiError(httpStatus.CONFLICT, 'Overlapping availability slot exists!');
  }

  const result = await prisma.availability.create({
    data: {
      guideId,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isAvailable: payload.isAvailable ?? true,
    },
  });

  return result;
};

const getMyAvailability = async (options: any, user: IAuthUser) => {
  if (!user || user.role !== 'GUIDE') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only guides can view their own availability!');
  }

  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const result = await prisma.availability.findMany({
    where: { guideId: user.id },
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder }
      : { date: 'asc', startTime: 'asc' },
  });

  const total = await prisma.availability.count({ where: { guideId: user.id } });

  return { meta: { page, limit, total }, data: result };
};

const getAllAvailabilities = async (filters: any, options: any) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { guideId, date, isAvailable } = filters;

  const andConditions: Prisma.AvailabilityWhereInput[] = [];

  if (guideId) {
    andConditions.push({ guideId });
  }

  if (date) {
    // Filter by date (match day, month, year)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    andConditions.push({
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    });
  }

  if (typeof isAvailable === 'boolean') {
    andConditions.push({ isAvailable });
  }

  const whereConditions: Prisma.AvailabilityWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.availability.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder }
      : { date: 'asc', startTime: 'asc' },
    include: {
        guide: {
            select: {
                id: true,
                name: true,
                email: true,
                photo: true,
            }
        }
    }
  });

  const total = await prisma.availability.count({ where: whereConditions });

  return { meta: { page, limit, total }, data: result };
};

const getSingleAvailability = async (id: string) => {
  const result = await prisma.availability.findUniqueOrThrow({
    where: { id },
    include: {
        guide: {
            select: {
                id: true,
                name: true,
                email: true,
                photo: true,
            }
        }
    }
  });
  return result;
};

const updateAvailability = async (id: string, payload: any, user: IAuthUser) => {
  if (!user || user.role !== 'GUIDE') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only guides can update availability slots!');
  }

  const existing = await prisma.availability.findUniqueOrThrow({ where: { id } });

  if (existing.guideId !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own availability slots!');
  }

  const { date, startTime, endTime } = payload;
  if (date || startTime || endTime) {
    // Check for overlapping availability if date or time fields are updated
    const newDate = date ? new Date(date) : existing.date;
    const newStartTime = startTime ? new Date(startTime) : existing.startTime;
    const newEndTime = endTime ? new Date(endTime) : existing.endTime;

    const overlappingAvailability = await prisma.availability.findFirst({
      where: {
        id: { not: id }, // Exclude current slot
        guideId: user.id,
        date: newDate,
        OR: [
          {
            startTime: { lt: newEndTime },
            endTime: { gt: newStartTime },
          },
        ],
      },
    });

    if (overlappingAvailability) {
      throw new ApiError(httpStatus.CONFLICT, 'Updated slot overlaps with an existing availability!');
    }
  }

  const result = await prisma.availability.update({
    where: { id },
    data: {
      ...(date ? { date: new Date(date) } : {}),
      ...(startTime ? { startTime: new Date(startTime) } : {}),
      ...(endTime ? { endTime: new Date(endTime) } : {}),
      ...(typeof payload.isAvailable !== 'undefined' ? { isAvailable: payload.isAvailable } : {}),
    },
  });

  return result;
};

const deleteAvailability = async (id: string, user: IAuthUser) => {
  if (!user || user.role !== 'GUIDE') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only guides can delete availability slots!');
  }

  const existing = await prisma.availability.findUniqueOrThrow({ where: { id } });

  if (existing.guideId !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own availability slots!');
  }

  const result = await prisma.availability.delete({ where: { id } });
  return result;
};

export const AvailabilityService = {
  createAvailability,
  getMyAvailability,
  getAllAvailabilities,
  getSingleAvailability,
  updateAvailability,
  deleteAvailability,
};
