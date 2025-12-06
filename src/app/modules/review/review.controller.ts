import { Request, Response } from "express";
import { ReviewService } from "./review.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";

const createReview = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await ReviewService.createReview(
      req.body,
      req.user as IAuthUser
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Review submitted successfully!",
      data: result,
    });
  }
);

const getReviewsByListing = catchAsync(async (req: Request, res: Response) => {
  const { listingId } = req.params;
  const result = await ReviewService.getReviewsByListing(listingId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews fetched successfully!",
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getReviewsByListing,
};
