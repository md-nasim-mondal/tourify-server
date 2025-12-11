import httpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import ApiError from "../errors/ApiError";
import envVars from "../../config/env";
import type { Secret } from "jsonwebtoken";

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      let token = await req.cookies.accessToken;

      if (!token && req.headers.authorization) {
        // Extract token from "Bearer <token>"
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.slice(7);
        } else {
          token = authHeader;
        }
      }

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        envVars.jwt.JWT_SECRET as Secret
      );

      req.user = verifiedUser;

      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden access!");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
