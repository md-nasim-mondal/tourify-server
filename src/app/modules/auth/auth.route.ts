import express from "express";
import { AuthController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { AuthValidation } from "./auth.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/register",
  validateRequest(AuthValidation.registerValidation),
  AuthController.registerUser
);

router.post(
  "/verify-email",
  validateRequest(AuthValidation.verifyEmailValidation),
  AuthController.verifyEmail
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginValidation),
  AuthController.loginUser
);

router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenValidation),
  AuthController.refreshToken
);

router.post(
  "/change-password",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  validateRequest(AuthValidation.changePasswordValidation),
  AuthController.changePassword
);

router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

export const AuthRoutes = router;
