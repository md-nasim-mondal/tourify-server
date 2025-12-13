import { UserRole, UserStatus, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { Request } from "express";
import httpStatus from "http-status";
import envVars from "../../../config/env";
import { fileUploader } from "../../../helpers/fileUploader";
import { prisma } from "../../../shared/prisma";
import { IAuthUser } from "../../interfaces/common";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { userSearchAbleFields } from "./user.constants";
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
    Number(envVars.bcrypt.SALT_ROUND)
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
    Number(envVars.bcrypt.SALT_ROUND)
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

// 4. Get Single User
const getSingleUser = async (id: string) => {
  return await prisma.user.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      isVerified: true,
      photo: true,
      bio: true,
      contactNo: true,
      address: true,
      gender: true,
      expertise: true,
      languagesSpoken: true,
      dailyRate: true,
      travelPreferences: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// Public user view (limited fields)
const getPublicUser = async (id: string) => {
  return await prisma.user.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      name: true,
      photo: true,
      bio: true,
      role: true,
      isVerified: true,
      languagesSpoken: true,
      expertise: true,
    },
  });
};

// 5. Get My Profile
const getMyProfile = async (user: IAuthUser) => {
  return await prisma.user.findUniqueOrThrow({
    where: { email: user?.email as string, status: UserStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isVerified: true,
      photo: true,
      bio: true,
      contactNo: true,
      address: true,
      gender: true,
      expertise: true,
      languagesSpoken: true,
      dailyRate: true,
      travelPreferences: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// 6. Update My Profile
const updateMyProfile = async (user: IAuthUser, req: Request) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: { email: user?.email as string, status: UserStatus.ACTIVE },
  });

  const file = req.file;
  if (file) {
    const uploaded = await fileUploader.uploadToCloudinary(file);
    req.body.photo = uploaded?.secure_url;
  }

  if (req.body.languagesSpoken && typeof req.body.languagesSpoken === 'string') {
    req.body.languagesSpoken = req.body.languagesSpoken.split(",").map((s: string) => s.trim());
  }
  if (req.body.expertise && typeof req.body.expertise === 'string') {
    req.body.expertise = req.body.expertise.split(",").map((s: string) => s.trim());
  }
  if (req.body.travelPreferences && typeof req.body.travelPreferences === 'string') {
    req.body.travelPreferences = req.body.travelPreferences.split(",").map((s: string) => s.trim());
  }
  if (req.body.dailyRate && typeof req.body.dailyRate === 'string') {
    req.body.dailyRate = parseFloat(req.body.dailyRate);
  }

  return await prisma.user.update({
    where: { email: userInfo.email },
    data: req.body,
  });
};

// 7. Update User (by Admin)
const updateUser = async (id: string, req: Request) => {
  const userData = await prisma.user.findUniqueOrThrow({ where: { id } });

  const file = req.file;
  if (file) {
    const uploaded = await fileUploader.uploadToCloudinary(file);
    req.body.photo = uploaded?.secure_url;
  }

  if (req.body.languagesSpoken && typeof req.body.languagesSpoken === 'string') {
    req.body.languagesSpoken = req.body.languagesSpoken.split(",").map((s: string) => s.trim());
  }
  if (req.body.expertise && typeof req.body.expertise === 'string') {
    req.body.expertise = req.body.expertise.split(",").map((s: string) => s.trim());
  }
  if (req.body.travelPreferences && typeof req.body.travelPreferences === 'string') {
    req.body.travelPreferences = req.body.travelPreferences.split(",").map((s: string) => s.trim());
  }
  if (req.body.dailyRate && typeof req.body.dailyRate === 'string') {
    req.body.dailyRate = parseFloat(req.body.dailyRate);
  }

  // Handle password change if provided
  if (req.body.password) {
    req.body.password = await bcrypt.hash(
      req.body.password,
      Number(envVars.bcrypt.SALT_ROUND)
    );
  }

  return await prisma.user.update({
    where: { id },
    data: req.body,
  });
};


// 8. Change User Status (With Security Check)
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

// 9. Change User Role (With Security Check)
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

// 10. Soft Delete User (Set status to DELETED/BLOCKED)
const softDeleteUser = async (id: string) => {
  await prisma.user.findUniqueOrThrow({ where: { id } });
  
  return await prisma.user.update({
    where: { id },
    data: { status: UserStatus.BLOCKED }, // Using BLOCKED as "Soft Deleted" based on enum
  });
};

// 11. Hard Delete User (Remove from DB)
const hardDeleteUser = async (id: string) => {
  await prisma.user.findUniqueOrThrow({ where: { id } });

  return await prisma.user.delete({
    where: { id },
  });
};

export const UserService = {
  createAdmin,
  createGuide,
  getAllUsers,
  getSingleUser,
  getPublicUser,
  getMyProfile,
  updateMyProfile,
  updateUser,
  changeUserStatus,
  changeUserRole,
  softDeleteUser,
  hardDeleteUser,
};
