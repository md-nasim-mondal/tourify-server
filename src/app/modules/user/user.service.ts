import { UserRole, UserStatus, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { Request } from "express";
import httpStatus from "http-status";
import { config } from "../../../config";
import { fileUploader } from "../../../helpers/fileUploader";
import { prisma } from "../../../shared/prisma";
import { IAuthUser } from "../../interfaces/common";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { userSearchAbleFields } from "./user.constant";
import ApiError from "../../errors/ApiError";

// 1. Create Admin (Only by Super Admin)
const createAdmin = async (req: Request) => {
  const file = req.file;
  let profilePhoto = "";
  if (file) {
    const uploaded = await fileUploader.uploadToCloudinary(file);
    profilePhoto = uploaded?.secure_url || "";
  }

  const hashedPassword = await bcrypt.hash(
    req.body.password,
    Number(config.bcrypt.SALT_ROUND)
  );

  return await prisma.user.create({
    data: {
      email: req.body.admin.email,
      password: hashedPassword,
      name: req.body.admin.name,
      contactNo: req.body.admin.contactNo,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
      photo: profilePhoto,
    },
  });
};

// 2. Create Guide (By Admin/Super Admin)
const createGuide = async (req: Request) => {
  const file = req.file;
  let profilePhoto = "";
  if (file) {
    const uploaded = await fileUploader.uploadToCloudinary(file);
    profilePhoto = uploaded?.secure_url || "";
  }

  const hashedPassword = await bcrypt.hash(
    req.body.password,
    Number(config.bcrypt.SALT_ROUND)
  );

  return await prisma.user.create({
    data: {
      email: req.body.guide.email,
      password: hashedPassword,
      name: req.body.guide.name,
      contactNo: req.body.guide.contactNo,
      bio: req.body.guide.bio,
      address: req.body.guide.address,
      role: UserRole.GUIDE,
      status: UserStatus.ACTIVE,
      isVerified: true,
      photo: profilePhoto,
    },
  });
};

// 3. Get All Users
const getAllUsers = async (params: any, options: any) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder }
      : { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      photo: true,
    },
  });

  const total = await prisma.user.count({ where: whereConditions });

  return { meta: { page, limit, total }, data: result };
};

// 4. Get My Profile
const getMyProfile = async (user: IAuthUser) => {
  return await prisma.user.findUniqueOrThrow({
    where: { email: user?.email as string, status: UserStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      photo: true,
      bio: true,
      contactNo: true,
      address: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// 5. Update My Profile
const updateMyProfile = async (user: IAuthUser, req: Request) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: { email: user?.email as string, status: UserStatus.ACTIVE },
  });

  const file = req.file;
  if (file) {
    const uploaded = await fileUploader.uploadToCloudinary(file);
    req.body.photo = uploaded?.secure_url;
  }

  return await prisma.user.update({
    where: { email: userInfo.email },
    data: req.body,
  });
};

// 6. Change User Status (With Security Check)
const changeUserStatus = async (
  id: string,
  status: UserStatus,
  currentUser: IAuthUser
) => {
  const userData = await prisma.user.findUniqueOrThrow({ where: { id } });

  // Security: Admin cannot block Super Admin
  if (
    currentUser?.role === UserRole.ADMIN &&
    userData.role === UserRole.SUPER_ADMIN
  ) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Admins cannot change status of Super Admins!"
    );
  }

  return await prisma.user.update({
    where: { id },
    data: { status },
  });
};

// 7. Change User Role (With Security Check)
const changeUserRole = async (
  id: string,
  role: UserRole,
  currentUser: IAuthUser
) => {
  const userData = await prisma.user.findUniqueOrThrow({ where: { id } });

  // Security: Admin cannot change role of Super Admin
  if (
    currentUser?.role === UserRole.ADMIN &&
    userData.role === UserRole.SUPER_ADMIN
  ) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Admins cannot modify Super Admins!"
    );
  }

  return await prisma.user.update({
    where: { id },
    data: { role },
  });
};

export const UserService = {
  createAdmin,
  createGuide,
  getAllUsers,
  getMyProfile,
  updateMyProfile,
  changeUserStatus,
  changeUserRole,
};
