import { Request, Response } from "express";
import { ReviewService } from "./review.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import pick from "../../../shared/pick";
import { reviewFilterableFields } from "./review.constants";


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

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, reviewFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await ReviewService.getAllReviews(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

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

const getSingleReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewService.getSingleReview(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review retrieved successfully!",
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await ReviewService.getMyReviews(req.user as IAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My reviews fetched successfully!",
    data: result,
  });
});

const updateReview = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const result = await ReviewService.updateReview(
      id as string,
      req.body,
      req.user as IAuthUser
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Review updated successfully!",
      data: result,
    });
  }
);

const deleteReview = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const result = await ReviewService.deleteReview(
      id as string,
      req.user as IAuthUser
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Review deleted successfully!",
      data: result,
    });
  }
);

export const ReviewController = {
  createReview,
  getAllReviews,
  getReviewsByListing,
  getSingleReview,
  updateReview,
  deleteReview,
  getMyReviews,
};
