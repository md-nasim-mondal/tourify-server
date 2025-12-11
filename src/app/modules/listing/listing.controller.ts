import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ListingService } from "./listing.service";
import { IAuthUser } from "../../interfaces/common";

const createListing = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const result = await ListingService.createListing(
      req,
      req.user as IAuthUser
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Listing created successfully!",
      data: result,
    });
  }
);

const getAllListings = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.getAllListings(req.query, req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Listings fetched successfully!",
    meta: result.meta,
    data: result.data,
    filters: result.filters,
  });
});

const getMyCreateListings = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const result = await ListingService.getMyCreateListings(req.query, req.query, req.user as IAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Listings fetched successfully!",
    meta: result.meta,
    data: result.data,
    filters: result.filters,
  });
});

const getSingleListing = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.getSingleListing(req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Listing fetched successfully!",
    data: result,
  });
});

const updateListing = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const result = await ListingService.updateListing(
      req.params.id as string,
      req,
      req.user as IAuthUser
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Listing updated successfully!",
      data: result,
    });
  }
);

const deleteListing = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const result = await ListingService.deleteListing(
      req.params.id as string,
      req.user as IAuthUser
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Listing deleted successfully!",
      data: result,
    });
  }
);

const getCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.getCategories();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories fetched successfully!",
    data: result,
  });
});

const getLanguages = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.getLanguages();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Languages fetched successfully!",
    data: result,
  });
});

const getMapData = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.getMapData(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Map data fetched successfully!",
    data: result,
  });
});

export const ListingController = {
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
