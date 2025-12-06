import express from "express";
import { MetaController } from "./meta.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  MetaController.getDashboardMetadata
);

export const MetaRoutes = router;