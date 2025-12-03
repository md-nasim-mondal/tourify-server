import { Request, Response } from "express";
import { ListingService } from "./listing.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import pick from "../../../shared/pick";
import { listingFilterableFields } from "./listing.constants";
import { IAuthUser } from "../../interfaces/common";

const createListing = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
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
  const filters = pick(req.query, listingFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await ListingService.getAllListings(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Listings fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleListing = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ListingService.getSingleListing(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Listing fetched successfully!",
    data: result,
  });
});

const updateListing = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const result = await ListingService.updateListing(
      id as string,
      req.body,
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
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const result = await ListingService.deleteListing(
      id as string,
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

export const ListingController = {
  createListing,
  getAllListings,
  getSingleListing,
  updateListing,
  deleteListing,
};
