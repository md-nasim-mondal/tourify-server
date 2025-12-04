import { Request, Response } from "express";
import { BookingService } from "./booking.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import pick from "../../../shared/pick";
import { IAuthUser } from "../../interfaces/common";

const createBooking = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await BookingService.createBooking(req.body, req.user as IAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Booking request sent successfully!",
    data: result,
  });
});

const getAllBookings = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await BookingService.getAllBookings(options, req.user as IAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bookings fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleBooking = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.getSingleBooking(id as string, req.user as IAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking details fetched successfully!",
    data: result,
  });
});

const updateBookingStatus = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.updateBookingStatus(id as string, req.body.status, req.user as IAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking status updated successfully!",
    data: result,
  });
});

export const BookingController = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBookingStatus,
};