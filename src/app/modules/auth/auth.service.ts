import { UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import envVars from "../../../config/env";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import emailSender from "../../utils/emailSender";

// 1. Register Tourist (With Email Verification)
const registerUser = async (payload: any) => {
  const isExist = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists!");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(envVars.bcrypt.SALT_ROUND)
  );

  // Default Role: TOURIST, Status: ACTIVE, Verified: FALSE
  const newUser = await prisma.user.create({
    data: {
      email: payload.email,
      password: hashedPassword,
      name: payload.name,
      role: UserRole.TOURIST,
      status: UserStatus.ACTIVE,
      isVerified: false,
      contactNo: payload.contactNo,
      address: payload.address,
    },
  });

  // Generate Verification Token (1 Day Validity)
  const verifyToken = jwtHelpers.generateToken(
    { email: newUser.email, role: newUser.role, id: newUser.id },
    envVars.jwt.JWT_SECRET as Secret,
    "1d"
  );

  // Send Email
  const verifyLink = `${envVars.CLIENT_URL}/verify-email?token=${verifyToken}`;
  await emailSender(
    newUser.email,
    `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Welcome to Tourify, ${newUser.name}!</h2>
      <p>Please verify your email address to start your journey.</p>
      <a href="${verifyLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
    </div>
    `
  );

  return {
    id: newUser.id,
    email: newUser.email,
    message: "Registration successful. Please check your email to verify.",
  };
};

// 2. Verify Email
const verifyEmail = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      envVars.jwt.JWT_SECRET as Secret
    );
  } catch (_err) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid or Expired Token!");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: decodedData.email },
  });

  if (user.isVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already verified!");
  }

  await prisma.user.update({
    where: { email: user.email },
    data: { isVerified: true },
  });

  return { message: "Email verified successfully!" };
};

// 3. Login User
const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  if (!userData.isVerified) {
    throw new ApiError(httpStatus.FORBIDDEN, "Please verify your email first!");
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password as string
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password incorrect!");
  }

  const accessToken = jwtHelpers.generateToken(
    { email: userData.email, role: userData.role, id: userData.id },
    envVars.jwt.JWT_SECRET as Secret,
    envVars.jwt.ACCESS_TOKEN_EXPIRES_IN as string
  );

  const refreshToken = jwtHelpers.generateToken(
    { email: userData.email, role: userData.role, id: userData.id },
    envVars.jwt.REFRESH_TOKEN_SECRET as Secret,
    envVars.jwt.REFRESH_TOKEN_EXPIRES_IN as string
  );

  return {
    accessToken,
    refreshToken,
    needPasswordChange: userData.needPasswordChange,
  };
};

// 4. Refresh Token
const refreshToken = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      envVars.jwt.REFRESH_TOKEN_SECRET as Secret
    );
  } catch (_err) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid Refresh Token");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: decodedData.email, status: UserStatus.ACTIVE },
  });

  const accessToken = jwtHelpers.generateToken(
    { email: userData.email, role: userData.role, id: userData.id },
    envVars.jwt.JWT_SECRET as Secret,
    envVars.jwt.ACCESS_TOKEN_EXPIRES_IN as string
  );

  return { accessToken };
};

// 5. Change Password
const changePassword = async (user: any, payload: any) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email, status: UserStatus.ACTIVE },
  });

  const isCorrectPassword = await bcrypt.compare(
    payload.oldPassword,
    userData.password as string
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect old password!");
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(envVars.bcrypt.SALT_ROUND)
  );

  await prisma.user.update({
    where: { email: userData.email },
    data: {
      password: hashedPassword,
      needPasswordChange: false,
    },
  });

  return { message: "Password changed successfully!" };
};

// 6. Forgot Password
const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: payload.email, status: UserStatus.ACTIVE },
  });

  const resetPassToken = jwtHelpers.generateToken(
    { email: userData.email, role: userData.role, id: userData.id },
    envVars.jwt.RESET_PASS_SECRET as Secret,
    envVars.jwt.RESET_PASS_TOKEN_EXPIRES_IN as string
  );

  const resetPassLink = `${envVars.CLIENT_URL}/reset-password?userId=${userData.id}&token=${resetPassToken}`;

  await emailSender(
    userData.email,
    `
    <div>
        <p>Dear ${userData.name},</p>
        <p>Click below to reset your password:</p>
        <a href="${resetPassLink}">Reset Password</a>
    </div>
    `
  );
};

// 7. Reset Password
const resetPassword = async (token: string, payload: { password: string }) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      envVars.jwt.RESET_PASS_SECRET as Secret
    );
  } catch (_err) {
    throw new ApiError(httpStatus.FORBIDDEN, "Expired or Invalid Token");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(envVars.bcrypt.SALT_ROUND)
  );

  await prisma.user.update({
    where: { id: decodedData.id },
    data: { password: hashedPassword },
  });
};

export const AuthService = {
  registerUser,
  verifyEmail,
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};
