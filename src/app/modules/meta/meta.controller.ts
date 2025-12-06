import { Request, Response } from "express";
import { MetaService } from "./meta.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";

const getDashboardMetadata = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await MetaService.getDashboardMetadata(req.user as IAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard metadata fetched successfully!",
    data: result,
  });
});

export const MetaController = {
  getDashboardMetadata,
};