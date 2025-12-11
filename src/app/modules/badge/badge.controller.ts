import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { BadgeService } from './badge.service';
import pick from '../../../shared/pick';

const createBadge = catchAsync(async (req: Request, res: Response) => {
  const result = await BadgeService.createBadge(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Badge created successfully!',
    data: result,
  });
});

const assignBadgeToUser = catchAsync(async (req: Request, res: Response) => {
  const { userId, badgeId } = req.body;
  const result = await BadgeService.assignBadgeToUser(userId, badgeId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Badge assigned to user successfully!',
    data: result,
  });
});

const revokeBadgeFromUser = catchAsync(async (req: Request, res: Response) => {
  const { userId, badgeId } = req.body;
  const result = await BadgeService.revokeBadgeFromUser(userId, badgeId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Badge revoked from user successfully!',
    data: result,
  });
});

const getAllBadges = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['searchTerm', 'name']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await BadgeService.getAllBadges(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Badges retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleBadge = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new Error('Badge ID is required');
  }
  const result = await BadgeService.getSingleBadge(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Badge retrieved successfully!',
    data: result,
  });
});

const updateBadge = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new Error('Badge ID is required');
  }
  const result = await BadgeService.updateBadge(id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Badge updated successfully!',
    data: result,
  });
});

const deleteBadge = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new Error('Badge ID is required');
  }
  const result = await BadgeService.deleteBadge(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Badge deleted successfully!',
    data: result,
  });
});

export const BadgeController = {
  createBadge,
  assignBadgeToUser,
  revokeBadgeFromUser,
  getAllBadges,
  getSingleBadge,
  updateBadge,
  deleteBadge,
};
