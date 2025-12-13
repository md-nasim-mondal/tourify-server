import express, { NextFunction, Request, Response } from "express";
import { UserController } from "./user.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./user.validation";

const router = express.Router();

// Admin Creation (Only Super Admin)
router.post(
  "/create-admin",
  auth(UserRole.SUPER_ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  validateRequest(UserValidation.createAdminValidation),
  UserController.createAdmin
);

// Guide Creation (Admin / Super Admin)
router.post(
  "/create-guide",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  validateRequest(UserValidation.createGuideValidation),
  UserController.createGuide
);

// Get All Users (Admin / Super Admin)
router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.getAllUsers
);

// Get My Profile (All Authenticated Users)
router.get(
  "/me",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  UserController.getMyProfile
);

// Get Single User (Admin / Super Admin)
router.get(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.getSingleUser
);

// Public: Get user basic profile by id
router.get(
  "/public/:id",
  UserController.getPublicUser
);



// Update My Profile (All Authenticated Users)
router.patch(
  "/update-my-profile",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
       req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(UserValidation.updateMyProfileValidation),
  UserController.updateMyProfile
);

// Update User (Admin / Super Admin)
router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
       req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(UserValidation.updateUserValidation),
  UserController.updateUser
);


// Change Status (Block/Unblock)
router.patch(
  "/:id/status",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(UserValidation.updateStatusValidation),
  UserController.changeUserStatus
);

// Change Role (Promote/Demote)
router.patch(
  "/:id/role",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(UserValidation.updateRoleValidation),
  UserController.changeUserRole
);

// Soft Delete User
router.delete(
  "/:id/soft",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.softDeleteUser
);

// Hard Delete User
router.delete(
  "/:id/hard",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.hardDeleteUser
);

export const UserRoutes = router;
