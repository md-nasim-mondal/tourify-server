import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AvailabilityService } from './availability.service';
import { IAuthUser } from '../../interfaces/common';
import pick from '../../../shared/pick';

const createAvailability = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const result = await AvailabilityService.createAvailability(req.body, req.user as IAuthUser);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Availability slot created successfully!',
      data: result,
    });
  }
);

const getMyAvailability = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await AvailabilityService.getMyAvailability(options, req.user as IAuthUser);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'My availability slots retrieved successfully!',
      meta: result.meta,
      data: result.data,
    });
  }
);

const getAllAvailabilities = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['guideId', 'date', 'isAvailable']); // Add more filterable fields as needed
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await AvailabilityService.getAllAvailabilities(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability slots retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleAvailability = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new Error('Availability ID is required');
  }
  const result = await AvailabilityService.getSingleAvailability(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability slot retrieved successfully!',
    data: result,
  });
});

const updateAvailability = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Availability ID is required');
    }
    const result = await AvailabilityService.updateAvailability(id as string, req.body, req.user as IAuthUser);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Availability slot updated successfully!',
      data: result,
    });
  }
);

const deleteAvailability = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Availability ID is required');
    }
    const result = await AvailabilityService.deleteAvailability(id as string, req.user as IAuthUser);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Availability slot deleted successfully!',
      data: result,
    });
  }
);

export const AvailabilityController = {
  createAvailability,
  getMyAvailability,
  getAllAvailabilities,
  getSingleAvailability,
  updateAvailability,
  deleteAvailability,
};
