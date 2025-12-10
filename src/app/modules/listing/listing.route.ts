import express, { NextFunction, Request, Response } from "express";
import { ListingController } from "./listing.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";
import validateRequest from "../../middlewares/validateRequest";
import { ListingValidation } from "./listing.validation";

const router = express.Router();

// Create Listing (Only Guide can create) - Handles Multiple Images
router.post(
  "/",
  auth(UserRole.GUIDE),
  fileUploader.upload.array("images", 5), // Max 5 images
  (req: Request, res: Response, next: NextFunction) => {
    // Parse body data because multer converts everything to string/multipart
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(ListingValidation.createListingValidation),
  ListingController.createListing
);

// Update Listing (Only Guide)
router.patch(
  "/:id",
  auth(UserRole.GUIDE),
  fileUploader.upload.array("images", 5), // Allow image updates
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(ListingValidation.updateListingValidation),
  ListingController.updateListing
);

// Delete Listing (Guide owns it OR Admin)
router.delete(
  "/:id",
  auth(UserRole.GUIDE, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ListingController.deleteListing
);

// Get All Listings (Public)
router.get("/", ListingController.getAllListings);

// Get Single Listing (Public)
router.get("/:id", ListingController.getSingleListing);

// Get Categories (Public)
router.get("/categories/list", ListingController.getCategories);

// Get Languages (Public)
router.get("/languages/list", ListingController.getLanguages);

// Get Map Data (Public)
router.get("/map-data", ListingController.getMapData);

export const ListingRoutes = router;